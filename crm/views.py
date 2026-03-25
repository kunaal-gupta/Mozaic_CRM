import json
from decimal import Decimal

from django.db.models import Count
from django.http import HttpRequest, JsonResponse
from django.shortcuts import get_object_or_404, render
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from .models import Activity, Communication, Contact, Deal, DealContact, Note, Property, User


def _decimal_to_float(value):
    if isinstance(value, Decimal):
        return float(value)
    return value


def serialize_property(prop: Property):
    return {
        "id": str(prop.property_id),
        "community": prop.community,
        "address": prop.address,
        "beds": prop.beds,
        "baths": _decimal_to_float(prop.baths),
        "size": _decimal_to_float(prop.size),
        "year_built": prop.year_built,
        "is_our_inventory": prop.is_our_inventory,
        "builder": prop.property_builder,
        "building_type": prop.building_type,
    }


def serialize_contact(contact: Contact):
    return {
        "id": str(contact.id),
        "full_name": contact.full_name,
        "email": contact.email,
        "phone_number": contact.phone_number,
        "company": contact.company,
        "professional_role": contact.professional_role,
    }


def serialize_deal(deal: Deal):
    return {
        "id": str(deal.id),
        "listing_id": str(deal.listing_id),
        "listing_address": deal.listing.address,
        "stage": deal.stage,
        "agent": deal.agent_to.full_name if deal.agent_to else None,
        "contacts": [serialize_contact(contact) for contact in deal.contacts.all()],
        "updated_at": deal.updated_at.isoformat(),
    }


def ensure_seed_data():
    if Property.objects.exists():
        return

    admin = User.objects.create(
        email="admin@mozaiccrm.com",
        full_name="Amelia Grant",
        access_role=User.AccessRole.ADMIN,
        professional_role="Broker",
    )
    agent = User.objects.create(
        email="agent@mozaiccrm.com",
        full_name="Noah Patel",
        access_role=User.AccessRole.AGENT,
        professional_role="Senior Agent",
    )

    p1 = Property.objects.create(
        community="Riverside",
        address="125 Riverwalk Ave",
        beds=4,
        baths=3.5,
        size=2480,
        year_built=2021,
        property_builder="Lakeside Homes",
        building_type="Detached",
        is_our_inventory=True,
    )
    p2 = Property.objects.create(
        community="Downtown Core",
        address="908 Aurora Tower",
        beds=2,
        baths=2,
        size=1120,
        year_built=2019,
        property_builder="Metro Build",
        building_type="Condo",
    )

    buyer = Contact.objects.create(
        email="buyer.one@example.com",
        full_name="Mia Turner",
        phone_number="(555) 810-2102",
        company="Turner Ventures",
        professional_role=Contact.ProfessionalRole.BUYER,
        assigned_to=agent,
        created_by=admin,
    )
    seller = Contact.objects.create(
        email="seller.one@example.com",
        full_name="Lucas Harper",
        phone_number="(555) 773-1134",
        professional_role=Contact.ProfessionalRole.SELLER,
        assigned_to=agent,
        created_by=admin,
    )

    d1 = Deal.objects.create(listing=p1, stage=Deal.Stage.SHOWING, agent_to=agent)
    d2 = Deal.objects.create(listing=p2, stage=Deal.Stage.OFFER, agent_to=agent)

    DealContact.objects.create(deal=d1, contact=buyer)
    DealContact.objects.create(deal=d2, contact=seller)

    Activity.objects.create(
        listing=p1,
        deal=d1,
        contact=buyer,
        type=Activity.ActivityType.MEETING,
        description="Initial property tour completed.",
        created_by=agent,
    )
    Note.objects.create(
        listing=p1,
        contact=buyer,
        content="Buyer wants south-facing backyard and office space.",
        created_by=agent,
    )
    Communication.objects.create(
        listing=p1,
        contact=buyer,
        type=Communication.CommunicationType.CHAT,
        message="Sent disclosure package and financing checklist.",
        sender=agent,
    )


@require_http_methods(["GET"])
def app_shell(request: HttpRequest):
    ensure_seed_data()
    return render(request, "crm/index.html")


@require_http_methods(["GET"])
def dashboard_data(request: HttpRequest):
    ensure_seed_data()
    deal_counts = dict(Deal.objects.values_list("stage").annotate(total=Count("id")))
    return JsonResponse(
        {
            "stats": {
                "properties": Property.objects.count(),
                "contacts": Contact.objects.count(),
                "deals": Deal.objects.count(),
                "active_deals": Deal.objects.exclude(stage__in=[Deal.Stage.CLOSED, Deal.Stage.LOST]).count(),
            },
            "pipeline": [
                {"stage": stage, "count": deal_counts.get(stage, 0)}
                for stage, _ in Deal.Stage.choices
            ],
        }
    )


@require_http_methods(["GET"])
def listings(request: HttpRequest):
    ensure_seed_data()
    data = [serialize_property(prop) for prop in Property.objects.all()[:100]]
    return JsonResponse({"results": data})


@require_http_methods(["GET"])
def listing_detail(request: HttpRequest, listing_id):
    listing = get_object_or_404(Property, pk=listing_id)
    notes = [
        {
            "id": str(note.id),
            "content": note.content,
            "created_at": note.created_at.isoformat(),
            "created_by": note.created_by.full_name if note.created_by else None,
        }
        for note in listing.notes.select_related("created_by")[:30]
    ]
    activities = [
        {
            "id": str(activity.id),
            "type": activity.type,
            "description": activity.description,
            "timestamp": activity.timestamp.isoformat(),
            "contact": activity.contact.full_name if activity.contact else None,
        }
        for activity in listing.activities.select_related("contact")[:30]
    ]
    communications = [
        {
            "id": str(msg.id),
            "type": msg.type,
            "message": msg.message,
            "timestamp": msg.timestamp.isoformat(),
            "contact": msg.contact.full_name,
            "sender": msg.sender.full_name if msg.sender else None,
        }
        for msg in listing.communications.select_related("contact", "sender")[:30]
    ]

    listing_deals = Deal.objects.filter(listing=listing).prefetch_related("contacts")
    contacts = [serialize_contact(contact) for contact in Contact.objects.filter(deals__in=listing_deals).distinct()]

    return JsonResponse(
        {
            "listing": serialize_property(listing),
            "deals": [serialize_deal(deal) for deal in listing_deals],
            "timeline": activities,
            "notes": notes,
            "communications": communications,
            "contacts": contacts,
        }
    )


@csrf_exempt
@require_http_methods(["GET", "POST"])
def contacts(request: HttpRequest):
    if request.method == "GET":
        return JsonResponse({"results": [serialize_contact(c) for c in Contact.objects.all()[:200]]})

    payload = json.loads(request.body or "{}")
    contact = Contact.objects.create(
        full_name=payload["full_name"],
        email=payload["email"],
        phone_number=payload.get("phone_number", ""),
        company=payload.get("company", ""),
        professional_role=payload.get("professional_role", Contact.ProfessionalRole.BUYER),
    )
    return JsonResponse(serialize_contact(contact), status=201)


@csrf_exempt
@require_http_methods(["GET"])
def deals(request: HttpRequest):
    deal_qs = Deal.objects.select_related("listing", "agent_to").prefetch_related("contacts")
    return JsonResponse({"results": [serialize_deal(d) for d in deal_qs]})


@csrf_exempt
@require_http_methods(["PATCH"])
def deal_stage(request: HttpRequest, deal_id):
    payload = json.loads(request.body or "{}")
    deal = get_object_or_404(Deal, pk=deal_id)
    stage = payload.get("stage")
    allowed = {choice[0] for choice in Deal.Stage.choices}
    if stage not in allowed:
        return JsonResponse({"error": "Invalid stage"}, status=400)

    deal.stage = stage
    deal.save(update_fields=["stage", "updated_at"])
    return JsonResponse(serialize_deal(deal))


@csrf_exempt
@require_http_methods(["POST"])
def listing_note(request: HttpRequest, listing_id):
    listing = get_object_or_404(Property, pk=listing_id)
    payload = json.loads(request.body or "{}")
    note = Note.objects.create(listing=listing, content=payload["content"])
    return JsonResponse({"id": str(note.id), "content": note.content, "created_at": note.created_at.isoformat()}, status=201)

import json
from decimal import Decimal

from django.db.models import Count
from django.http import HttpRequest, JsonResponse
from django.shortcuts import get_object_or_404, render
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from .models import (
    Activity,
    Contact,
    Deal,
    DealContact,
    DealHistory,
    DealStage,
    Email,
    EmailTemplate,
    Property,
    Showing,
    ShowingParticipant,
    Task,
    User,
)


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
        "professional_role": contact.type,
        "type": contact.type,
    }


def serialize_deal(deal: Deal):
    return {
        "id": str(deal.id),
        "listing_id": str(deal.property_id),
        "listing_address": deal.property.address,
        "stage": deal.stage.name.lower(),
        "stage_name": deal.stage.name,
        "agent": deal.assigned_agent.full_name if deal.assigned_agent else None,
        "value": _decimal_to_float(deal.value),
        "contacts": [serialize_contact(contact) for contact in deal.contacts.all()],
        "updated_at": deal.updated_at.isoformat(),
    }


def ensure_stage_seed():
    for order, stage_name in enumerate(["Lead", "Showing", "Offer", "Closed", "Lost"], start=1):
        DealStage.objects.get_or_create(name=stage_name, defaults={"stage_order": order})


def ensure_seed_data():
    ensure_stage_seed()
    if Property.objects.exists():
        return

    admin = User.objects.create(
        email="admin@mozaiccrm.com",
        full_name="Amelia Grant",
        role=User.Role.ADMIN,
        job_title="Super Admin",
        company="Mozaic Group",
    )
    agent = User.objects.create(
        email="agent@mozaiccrm.com",
        full_name="Noah Patel",
        role=User.Role.AGENT,
        job_title="Senior Agent",
        company="Mozaic Group",
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
        type=Contact.ContactType.BUYER,
        assigned_to=agent,
        created_by=admin,
    )
    seller = Contact.objects.create(
        email="seller.one@example.com",
        full_name="Lucas Harper",
        phone_number="(555) 773-1134",
        type=Contact.ContactType.SELLER,
        assigned_to=agent,
        created_by=admin,
    )

    showing_stage = DealStage.objects.get(name="Showing")
    offer_stage = DealStage.objects.get(name="Offer")
    lead_stage = DealStage.objects.get(name="Lead")

    d1 = Deal.objects.create(property=p1, stage=showing_stage, assigned_agent=agent, value=985000)
    d2 = Deal.objects.create(property=p2, stage=offer_stage, assigned_agent=agent, value=715000)

    DealContact.objects.create(deal=d1, contact=buyer)
    DealContact.objects.create(deal=d2, contact=seller)

    DealHistory.objects.bulk_create([
        DealHistory(deal=d1, stage=lead_stage),
        DealHistory(deal=d1, stage=showing_stage),
        DealHistory(deal=d2, stage=lead_stage),
        DealHistory(deal=d2, stage=offer_stage),
    ])

    Activity.objects.create(
        deal=d1,
        contact=buyer,
        type=Activity.ActivityType.MEETING,
        description="Initial property tour completed and budget expectations aligned.",
        created_by=agent,
    )
    Activity.objects.create(
        deal=d1,
        contact=buyer,
        type=Activity.ActivityType.NOTE,
        description="Client requested south-facing backyard and office space.",
        created_by=agent,
    )

    Task.objects.create(
        title="Prepare comparative market analysis",
        description="Attach latest comps and send before offer review call.",
        deal=d1,
        contact=buyer,
        assigned_to=agent,
        due_date=timezone.now() + timezone.timedelta(days=2),
    )

    showing = Showing.objects.create(
        property=p1,
        deal=d1,
        scheduled_at=timezone.now() + timezone.timedelta(days=1),
        status=Showing.Status.SCHEDULED,
        notes="Bring feature sheet and financing checklist.",
    )
    ShowingParticipant.objects.create(showing=showing, contact=buyer)

    template = EmailTemplate.objects.create(
        subject="Next steps for your Riverside showing",
        body="Thanks for visiting. Attached are the disclosures and financing checklist.",
    )
    Email.objects.create(
        contact=buyer,
        trigger_type=Email.TriggerType.MANUAL,
        template=template,
        scheduled_at=timezone.now() + timezone.timedelta(hours=4),
        deal=d1,
        status=Email.Status.PENDING,
    )


@require_http_methods(["GET"])
def app_shell(request: HttpRequest):
    ensure_seed_data()
    return render(request, "crm/index.html")


@require_http_methods(["GET"])
def dashboard_data(request: HttpRequest):
    ensure_seed_data()

    stage_counts = {
        row["stage__name"]: row["total"]
        for row in Deal.objects.values("stage__name").annotate(total=Count("id"))
    }
    active_stage_ids = DealStage.objects.exclude(name__in=["Closed", "Lost"]).values_list("id", flat=True)

    return JsonResponse(
        {
            "stats": {
                "users": User.objects.count(),
                "properties": Property.objects.count(),
                "contacts": Contact.objects.count(),
                "deals": Deal.objects.count(),
                "active_deals": Deal.objects.filter(stage_id__in=active_stage_ids).count(),
                "tasks_pending": Task.objects.filter(status=Task.Status.PENDING).count(),
                "showings_upcoming": Showing.objects.filter(scheduled_at__gte=timezone.now()).count(),
            },
            "pipeline": [
                {"stage": stage.name.lower(), "label": stage.name, "count": stage_counts.get(stage.name, 0)}
                for stage in DealStage.objects.all()
            ],
        }
    )


@require_http_methods(["GET"])
def workflow_data(request: HttpRequest):
    ensure_seed_data()

    superadmin_flow = [
        "Onboard agents and client portal users",
        "Provision complete property inventory",
        "Grant role-based access to client contacts",
    ]
    agent_flow = [
        "Create property (if not already listed)",
        "Open a new deal linked to property",
        "Attach contacts to deal and assign responsibilities",
        "Advance deal stage: Lead → Showing → Offer → Closed/Lost",
        "Manage showings, participants, and post-visit notes",
        "Track activities, tasks, and email automations",
        "Upload contracts, brochures, and feature sheets",
    ]

    return JsonResponse(
        {
            "superadmin_flow": superadmin_flow,
            "agent_flow": agent_flow,
            "stage_policy": [stage.name for stage in DealStage.objects.order_by("stage_order")],
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
    listing_deals = Deal.objects.filter(property=listing).select_related("stage", "assigned_agent").prefetch_related("contacts")
    listing_contacts = Contact.objects.filter(deals__in=listing_deals).distinct()

    timeline = [
        {
            "id": str(activity.id),
            "type": activity.type,
            "description": activity.description,
            "timestamp": activity.created_at.isoformat(),
            "contact": activity.contact.full_name if activity.contact else None,
        }
        for activity in Activity.objects.filter(deal__in=listing_deals).select_related("contact")[:40]
    ]

    tasks = [
        {
            "id": str(task.id),
            "title": task.title,
            "status": task.status,
            "due_date": task.due_date.isoformat() if task.due_date else None,
        }
        for task in Task.objects.filter(deal__in=listing_deals)[:20]
    ]

    showings = [
        {
            "id": str(showing.id),
            "scheduled_at": showing.scheduled_at.isoformat(),
            "status": showing.status,
            "notes": showing.notes,
        }
        for showing in Showing.objects.filter(deal__in=listing_deals)[:20]
    ]

    notes = [item for item in timeline if item["type"] == Activity.ActivityType.NOTE]
    communications = [item for item in timeline if item["type"] in {Activity.ActivityType.CALL, Activity.ActivityType.EMAIL, Activity.ActivityType.MEETING}]

    return JsonResponse(
        {
            "listing": serialize_property(listing),
            "deals": [serialize_deal(deal) for deal in listing_deals],
            "timeline": timeline,
            "notes": notes,
            "communications": communications,
            "tasks": tasks,
            "showings": showings,
            "contacts": [serialize_contact(contact) for contact in listing_contacts],
        }
    )


@csrf_exempt
@require_http_methods(["GET", "POST"])
def contacts(request: HttpRequest):
    ensure_seed_data()
    if request.method == "GET":
        return JsonResponse({"results": [serialize_contact(c) for c in Contact.objects.all()[:200]]})

    payload = json.loads(request.body or "{}")
    contact = Contact.objects.create(
        full_name=payload["full_name"],
        email=payload["email"],
        phone_number=payload.get("phone_number", ""),
        company=payload.get("company", ""),
        type=payload.get("professional_role", payload.get("type", Contact.ContactType.BUYER)),
    )
    return JsonResponse(serialize_contact(contact), status=201)


@csrf_exempt
@require_http_methods(["GET"])
def deals(request: HttpRequest):
    ensure_seed_data()
    deal_qs = Deal.objects.select_related("property", "assigned_agent", "stage").prefetch_related("contacts")
    return JsonResponse({"results": [serialize_deal(d) for d in deal_qs]})


@csrf_exempt
@require_http_methods(["PATCH"])
def deal_stage(request: HttpRequest, deal_id):
    payload = json.loads(request.body or "{}")
    deal = get_object_or_404(Deal.objects.select_related("stage"), pk=deal_id)
    stage_key = payload.get("stage", "").strip().lower()
    stage = DealStage.objects.filter(name__iexact=stage_key).first()
    if stage is None:
        return JsonResponse({"error": "Invalid stage"}, status=400)

    deal.stage = stage
    deal.save(update_fields=["stage", "updated_at"])
    DealHistory.objects.create(deal=deal, stage=stage)
    return JsonResponse(serialize_deal(deal))


@csrf_exempt
@require_http_methods(["POST"])
def listing_note(request: HttpRequest, listing_id):
    listing = get_object_or_404(Property, pk=listing_id)
    payload = json.loads(request.body or "{}")
    deal = Deal.objects.filter(property=listing).first()
    note = Activity.objects.create(
        deal=deal,
        type=Activity.ActivityType.NOTE,
        description=payload["content"],
    )
    return JsonResponse(
        {"id": str(note.id), "content": note.description, "created_at": note.created_at.isoformat()},
        status=201,
    )

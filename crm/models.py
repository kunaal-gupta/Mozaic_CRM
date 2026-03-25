import uuid

from django.db import models

# Create your models here.
class Activity(models.Model):
    class ActivityType(models.TextChoices):
        CALL = "call", "Call"
        EMAIL = "email", "Email"
        MEETING = "meeting", "Meeting"
        NOTES = "notes", "Notes"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    listing = models.ForeignKey("crm.Property", on_delete=models.CASCADE, related_name="activities")
    deal = models.ForeignKey("crm.Deal", on_delete=models.CASCADE, related_name="activities")
    contact = models.ForeignKey(
        "crm.Contact",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="activities",
    )
    type = models.CharField(max_length=20, choices=ActivityType.choices)
    description = models.TextField()
    created_by = models.ForeignKey(
        "crm.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="activities_created",
    )
    timestamp = models.DateTimeField(auto_now_add=True)



    class Meta:
        db_table = "activities"
        ordering = ["-timestamp"]



class Communication(models.Model):
    class CommunicationType(models.TextChoices):
        CHAT = "chat", "Chat"
        EMAIL = "email", "Email"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    listing = models.ForeignKey("crm.Property", on_delete=models.CASCADE, related_name="communications")
    contact = models.ForeignKey("crm.Contact", on_delete=models.CASCADE, related_name="communications")
    sender = models.ForeignKey(
        "crm.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="communications_sent",
    )
    message = models.TextField()
    type = models.CharField(max_length=20, choices=CommunicationType.choices)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "communications"
        ordering = ["-timestamp"]


class Contact(models.Model):
    class ProfessionalRole(models.TextChoices):
        BUYER = "buyer", "Buyer"
        SELLER = "seller", "Seller"
        INVESTOR = "investor", "Investor"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    full_name = models.CharField(max_length=255)
    phone_number = models.CharField(max_length=30, blank=True)
    company = models.CharField(max_length=255, blank=True)
    professional_role = models.CharField(max_length=20, choices=ProfessionalRole.choices)
    assigned_to = models.ForeignKey(
        "crm.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_contacts",
    )
    created_by = models.ForeignKey(
        "crm.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_contacts",
    )
    contact_of = models.ForeignKey(
        "crm.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="owned_contacts",
    )
    linked_user = models.ForeignKey(
        "crm.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="linked_contacts",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "contacts"
        ordering = ["full_name"]

    def __str__(self) -> str:
        return self.full_name




class Deal(models.Model):
    class Stage(models.TextChoices):
        LEAD = "lead", "Lead"
        SHOWING = "showing", "Showing"
        OFFER = "offer", "Offer"
        CLOSED = "closed", "Closed"
        LOST = "lost", "Lost"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    listing = models.ForeignKey("crm.Property", on_delete=models.CASCADE, related_name="deals")
    agent_to = models.ForeignKey(
        "crm.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="agent_deals",
    )
    stage = models.CharField(max_length=20, choices=Stage.choices, default=Stage.LEAD)
    contacts = models.ManyToManyField("crm.Contact", through="DealContact", related_name="deals")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "deals"
        ordering = ["-created_at"]


class DealContact(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    deal = models.ForeignKey("crm.Deal", on_delete=models.CASCADE, related_name="deal_contacts")
    contact = models.ForeignKey("crm.Contact", on_delete=models.CASCADE, related_name="deal_contacts")

    class Meta:
        db_table = "deal_contacts"
        constraints = [models.UniqueConstraint(fields=["deal", "contact"], name="uq_deal_contact")]




class Property(models.Model):
    property_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    property_builder = models.CharField(max_length=255, blank=True)
    year_built = models.IntegerField(null=True, blank=True)
    property_class = models.CharField(max_length=120, blank=True)
    building_type = models.CharField(max_length=120, blank=True)
    property_style = models.CharField(max_length=120, blank=True)
    model = models.CharField(max_length=120, blank=True)
    block_lot = models.CharField(max_length=120, blank=True)
    legal_plan = models.CharField(max_length=120, default="")
    community = models.CharField(max_length=255)
    address = models.CharField(max_length=255)
    occupancy = models.CharField(max_length=120, blank=True)
    condo_fees = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    c_dom = models.IntegerField(null=True, blank=True)
    dom = models.IntegerField(null=True, blank=True)
    flooring = models.CharField(max_length=120, blank=True)
    appliances_included = models.BooleanField(default=False)
    jr_high_school = models.CharField(max_length=255, blank=True)
    sr_high_school = models.CharField(max_length=255, blank=True)
    garage_type = models.CharField(max_length=120, blank=True)
    beds = models.IntegerField(null=True, blank=True)
    baths = models.DecimalField(max_digits=3, decimal_places=1, null=True, blank=True)
    size = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    floors = models.IntegerField(null=True, blank=True)
    basement = models.CharField(max_length=120, blank=True)
    basement_dev = models.CharField(max_length=120, blank=True)
    separate_entrance = models.BooleanField(default=False)
    possession = models.CharField(max_length=120, blank=True)
    landscaped = models.CharField(max_length=120, blank=True)
    den_level = models.CharField(max_length=120, blank=True)
    zero_lot_line = models.BooleanField(default=False)
    floor_plan_url = models.URLField(blank=True)
    added_date = models.DateTimeField(auto_now_add=True)
    is_our_inventory = models.BooleanField(default=False)

    class Meta:
        db_table = "properties"
        constraints = [
            models.UniqueConstraint(fields=["community", "block_lot", "legal_plan"], name="uq_property_community_block_legal")
        ]
        ordering = ["-added_date"]

    def __str__(self) -> str:
        return f"{self.community} - {self.address}"



class Note(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    listing = models.ForeignKey("crm.Property", on_delete=models.CASCADE, related_name="notes")
    contact = models.ForeignKey(
        "crm.Contact",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="notes",
    )
    content = models.TextField()
    created_by = models.ForeignKey(
        "crm.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="notes_created",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "notes"
        ordering = ["-created_at"]


class User(models.Model):
    class AccessRole(models.TextChoices):
        ADMIN = "admin", "Admin"
        AGENT = "agent", "Agent"
        CLIENT = "client", "Client"

    class Status(models.TextChoices):
        ACTIVE = "active", "Active"
        INACTIVE = "inactive", "Inactive"

    user_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    full_name = models.CharField(max_length=255)
    phone_number = models.CharField(max_length=30, blank=True)
    company = models.CharField(max_length=255, blank=True)
    access_role = models.CharField(max_length=10, choices=AccessRole.choices)
    professional_role = models.CharField(max_length=100, blank=True)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.ACTIVE)
    job_title = models.CharField(max_length=120, blank=True)
    location = models.CharField(max_length=255, blank=True)
    profile_photo = models.URLField(blank=True)
    last_active = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    company_banner = models.URLField(blank=True)

    class Meta:
        db_table = "users"
        ordering = ["full_name"]

    def __str__(self) -> str:
        return f"{self.full_name} <{self.email}>"
import uuid

from django.db import models


class User(models.Model):
    class Role(models.TextChoices):
        ADMIN = "admin", "Admin"
        AGENT = "agent", "Agent"
        CLIENT = "client", "Client"

    class Status(models.TextChoices):
        ACTIVE = "active", "Active"
        INACTIVE = "inactive", "Inactive"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    full_name = models.CharField(max_length=255)
    phone_number = models.CharField(max_length=30, blank=True)
    role = models.CharField(max_length=10, choices=Role.choices)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.ACTIVE)
    company = models.CharField(max_length=255, blank=True)
    job_title = models.CharField(max_length=120, blank=True)
    location = models.CharField(max_length=255, blank=True)
    profile_photo = models.URLField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "users"
        ordering = ["full_name"]

    def __str__(self) -> str:
        return self.full_name


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


class Contact(models.Model):
    class ContactType(models.TextChoices):
        BUYER = "buyer", "Buyer"
        SELLER = "seller", "Seller"
        INVESTOR = "investor", "Investor"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    full_name = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    phone_number = models.CharField(max_length=30, blank=True)
    type = models.CharField(max_length=20, choices=ContactType.choices)
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
    linked_user = models.ForeignKey(
        "crm.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="linked_contacts",
    )
    company = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "contacts"
        ordering = ["full_name"]
        indexes = [models.Index(fields=["assigned_to"], name="idx_contacts_assigned")]


class DealStage(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=50, unique=True)
    stage_order = models.IntegerField(unique=True)

    class Meta:
        db_table = "deal_stages"
        ordering = ["stage_order"]


class Deal(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    property = models.ForeignKey("crm.Property", on_delete=models.CASCADE, related_name="deals")
    assigned_agent = models.ForeignKey(
        "crm.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_deals",
    )
    stage = models.ForeignKey("crm.DealStage", on_delete=models.PROTECT, related_name="deals")
    value = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    contacts = models.ManyToManyField("crm.Contact", through="DealContact", related_name="deals")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "deal"
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["assigned_agent", "stage"], name="idx_deals_agent_stage")]


class DealContact(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    deal = models.ForeignKey("crm.Deal", on_delete=models.CASCADE, related_name="deal_contacts")
    contact = models.ForeignKey("crm.Contact", on_delete=models.CASCADE, related_name="deal_contacts")

    class Meta:
        db_table = "deal_contacts"
        constraints = [models.UniqueConstraint(fields=["deal", "contact"], name="uq_deal_contact")]


class DealHistory(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    deal = models.ForeignKey("crm.Deal", on_delete=models.CASCADE, related_name="history")
    stage = models.ForeignKey("crm.DealStage", on_delete=models.PROTECT, related_name="history")
    changed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "deal_history"
        ordering = ["-changed_at"]


class Activity(models.Model):
    class ActivityType(models.TextChoices):
        CALL = "call", "Call"
        EMAIL = "email", "Email"
        MEETING = "meeting", "Meeting"
        NOTE = "note", "Note"
        CUSTOM = "custom", "Custom"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    deal = models.ForeignKey("crm.Deal", on_delete=models.CASCADE, null=True, blank=True, related_name="activities")
    contact = models.ForeignKey("crm.Contact", on_delete=models.CASCADE, null=True, blank=True, related_name="activities")
    type = models.CharField(max_length=20, choices=ActivityType.choices)
    description = models.TextField()
    created_by = models.ForeignKey(
        "crm.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="activities_created",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "activities"
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["deal", "contact"], name="idx_activities_deal_contact")]


class Task(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        COMPLETED = "completed", "Completed"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    deal = models.ForeignKey("crm.Deal", on_delete=models.CASCADE, null=True, blank=True, related_name="tasks")
    contact = models.ForeignKey("crm.Contact", on_delete=models.CASCADE, null=True, blank=True, related_name="tasks")
    assigned_to = models.ForeignKey("crm.User", on_delete=models.SET_NULL, null=True, blank=True, related_name="tasks")
    due_date = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "tasks"
        ordering = ["due_date", "created_at"]
        indexes = [models.Index(fields=["assigned_to", "status"], name="idx_tasks_assigned_status")]


class Showing(models.Model):
    class Status(models.TextChoices):
        SCHEDULED = "scheduled", "Scheduled"
        COMPLETED = "completed", "Completed"
        CANCELLED = "cancelled", "Cancelled"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    property = models.ForeignKey("crm.Property", on_delete=models.CASCADE, related_name="showings")
    deal = models.ForeignKey("crm.Deal", on_delete=models.CASCADE, related_name="showings")
    scheduled_at = models.DateTimeField()
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.SCHEDULED)
    notes = models.TextField(blank=True)

    class Meta:
        db_table = "showings"
        ordering = ["-scheduled_at"]
        indexes = [models.Index(fields=["property", "scheduled_at"], name="idx_showings_property_schedule")]


class ShowingParticipant(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    showing = models.ForeignKey("crm.Showing", on_delete=models.CASCADE, related_name="participants")
    contact = models.ForeignKey("crm.Contact", on_delete=models.CASCADE, related_name="showing_participation")

    class Meta:
        db_table = "showing_participants"
        constraints = [models.UniqueConstraint(fields=["showing", "contact"], name="uq_showing_contact")]


class EmailTemplate(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    subject = models.CharField(max_length=255)
    body = models.TextField()

    class Meta:
        db_table = "email_templates"


class Email(models.Model):
    class TriggerType(models.TextChoices):
        MANUAL = "manual", "Manual"
        STAGE_CHANGE = "stage_change", "Stage Change"
        TIME_BASED = "time_based", "Time Based"

    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        SENT = "sent", "Sent"
        FAILED = "failed", "Failed"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    contact = models.ForeignKey("crm.Contact", on_delete=models.CASCADE, related_name="emails")
    trigger_type = models.CharField(max_length=20, choices=TriggerType.choices)
    template = models.ForeignKey("crm.EmailTemplate", on_delete=models.PROTECT, related_name="emails")
    scheduled_at = models.DateTimeField(null=True, blank=True)
    deal = models.ForeignKey("crm.Deal", on_delete=models.CASCADE, null=True, blank=True, related_name="emails")
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)

    class Meta:
        db_table = "emails"


class Document(models.Model):
    class DocumentType(models.TextChoices):
        FEATURE_SHEET = "feature_sheet", "Feature Sheet"
        CONTRACT = "contract", "Contract"
        BROCHURE = "brochure", "Brochure"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    property = models.ForeignKey("crm.Property", on_delete=models.CASCADE, null=True, blank=True, related_name="documents")
    deal = models.ForeignKey("crm.Deal", on_delete=models.CASCADE, null=True, blank=True, related_name="documents")
    uploaded_by = models.ForeignKey("crm.User", on_delete=models.SET_NULL, null=True, blank=True, related_name="uploaded_documents")
    file_url = models.URLField()
    type = models.CharField(max_length=20, choices=DocumentType.choices)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "documents"
        ordering = ["-created_at"]

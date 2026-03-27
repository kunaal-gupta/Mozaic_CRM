from django.contrib import admin

from .models import (
    Activity,
    Contact,
    Deal,
    DealHistory,
    DealStage,
    Document,
    Email,
    EmailTemplate,
    Property,
    Showing,
    ShowingParticipant,
    Task,
    User,
)

admin.site.register(User)
admin.site.register(Property)
admin.site.register(Contact)
admin.site.register(DealStage)
admin.site.register(Deal)
admin.site.register(DealHistory)
admin.site.register(Activity)
admin.site.register(Task)
admin.site.register(Showing)
admin.site.register(ShowingParticipant)
admin.site.register(EmailTemplate)
admin.site.register(Email)
admin.site.register(Document)

from django.contrib import admin

from .models import Deal, User, Contact, Activity, Note, Communication

# Register your models here.
admin.site.register(User)
admin.site.register(Contact)
admin.site.register(Deal)
admin.site.register(Activity)
admin.site.register(Note)
admin.site.register(Communication)

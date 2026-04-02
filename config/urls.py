from django.contrib import admin
from django.urls import path

from crm import views

urlpatterns = [
    path("admin/", admin.site.urls),
    path("", views.app_shell, name="crm-app"),
    path("api/dashboard/", views.dashboard_data, name="dashboard"),
    path("api/workflow/", views.workflow_data, name="workflow"),
    path("api/listings/", views.listings, name="listings"),
    path("api/listings/<uuid:listing_id>/", views.listing_detail, name="listing-detail"),
    path("api/listings/<uuid:listing_id>/notes/", views.listing_note, name="listing-note"),
    path("api/contacts/", views.contacts, name="contacts"),
    path("api/deals/", views.deals, name="deals"),
    path("api/deals/<uuid:deal_id>/stage/", views.deal_stage, name="deal-stage"),
]

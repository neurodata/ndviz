from django.conf import settings

def googleanalytics(request):
  """
  Use the variables returned in this function to render Google Analytics tracking
  code in templates. 
  From: http://www.nomadblue.com/blog/django/google-analytics-tracking-code-into-django-project/  
  """

  ga_prop_id = getattr(settings, 'GOOGLE_ANALYTICS_PROPERTY_ID', False)
  ga_domain = getattr(settings, 'GOOGLE_ANALYTICS_DOMAIN', False)
  #if not settings.DEBUG and ga_prop_id and ga_domain:
  if ga_prop_id and ga_domain:
    return {
      'GOOGLE_ANALYTICS_PROPERTY_ID': ga_prop_id,
      'GOOGLE_ANALYTICS_DOMAIN': ga_domain,
    }
  return {}


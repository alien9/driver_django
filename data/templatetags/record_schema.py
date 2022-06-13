from django import template
import json 
register = template.Library()

@register.filter()
def get_json(value):
    s=value

    if type(s).__name__=="str":
        return s
    s=s.get_current_schema()
    if s:
        return json.dumps(s.schema)
    return "{}"

@register.filter()
def as_json(value):
    if len(value):
        return json.dumps(value)
    return ""



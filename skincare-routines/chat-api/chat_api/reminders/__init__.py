"""Morning / night routine reminders over Web Push.

The browser owns the routine; it sends this service one record per device — the push subscription, the phone's time
zone, the two reminder times and the step names for each day of this week and next. A ticking loop fires one push per
slot per local day at that time. Nothing here reads the product data or the Gemini key.
"""

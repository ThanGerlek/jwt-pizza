# Incident: 2026-04-13 18-11-00

## Summary

Between 18:11 and 18:30 UTC on April 13, 2026, all users encountered complete
ordering failures. The event was triggered by a chaos monkey test intentionally
injected into the pizza factory service at approximately 18:11 UTC. The chaos
monkey automatically returned 500 errors for all pizza orders, rendering the
ordering system completely unavailable.

The incident was detected by the "failed pizzas" Grafana alert. Than Gerlek
began investigating within four minutes of receiving an automated notification email.
This **critical** incident affected **100%** of users attempting to place orders.

No support tickets or social media complaints were raised, likely due to the rapid
detection and resolution time.

## Detection

This incident was detected when the "failed pizzas" Grafana alert was triggered
at 18:12 UTC, notifying Than Gerlek via email.

Than Gerlek came online at 18:17 UTC and began investigating. There were no delays
in response or escalation needed, as the on-call engineer had full context of the
affected service.

Improvement: The existing Grafana alert proved highly effective for rapid detection.
Consider adding alerts for anomalous error patterns directly in the factory service,
to catch similar chaos engineering tests before they impact users.

## Impact

For 19 minutes between 18:11 UTC and 18:30 UTC on April 13, 2026, all users
experienced complete inability to place pizza orders due to the chaos monkey
returning 500 errors from the factory service.

This incident affected 100% of active users, who experienced universal order
failures with error responses from the backend.

Zero support tickets and zero social media posts were submitted, likely due
to the rapid resolution time.

## Timeline

All times are UTC on April 13, 2026.

- _18:11_ - Chaos monkey test begins, all pizza orders start failing
- _18:12_ - "Failed pizzas" Grafana alert is triggered
- _18:13_ - Alert has confirmed problem; email notification sent
- _18:17_ - Than Gerlek begins investigating the issue
- _18:21_ - Root cause identified via logs: chaos monkey injected in
factory service; automated remediation link found in logs
- _18:22_ - Than Gerlek follows the automated remediation link and
deactivates the chaos monkey
- _18:23_ - Rate of failed pizza orders begins dropping noticeably
- _18:25_ - Rate of failed pizza orders returns to normal baseline
- _18:28_ - Grafana alert resolves
- _18:30_ - Rate of failed pizza orders has remained normal for sustained
period; incident marked as resolved

## Response

After receiving the Grafana alert notification at 18:12 UTC, Than Gerlek came
online at 18:17 UTC and immediately began investigating the factory service logs.

No delays or obstacles impeded the response. The on-call engineer had direct
access to logs showing both the root cause and the solution.

## Root cause

A chaos monkey test was intentionally injected into the pizza factory service,
automatically returning 500 errors for all orders under failure conditions. The
test ran against the production system without restriction.

## Resolution

Than Gerlek identified an automated remediation link in the service logs. By
following this link, the chaos monkey was deactivated in the factory service.
Order failure rates returned to normal baseline levels within 2 minutes of the
deactivation.

## Prevention

This incident did not result from a previous known issue, as no similar incidents
have occurred before.

## Action items

1. Restrict chaos monkey testing to staging/simulated environments only; prevent
execution against production systems
   - Owner: Management decision pending
   - Target completion: TBD

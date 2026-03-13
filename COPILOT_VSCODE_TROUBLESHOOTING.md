# GitHub Copilot – VS Code Sonnet & Opus Model Access Troubleshooting

## Overview

You may be able to use Claude Sonnet or Claude Opus (and other premium models) inside the **GitHub Copilot agent on GitHub.com** but find those same models are missing or greyed-out in VS Code's Copilot Chat model picker. This guide explains why that gap exists and provides step-by-step instructions to resolve it.

---

## Why the Gap Exists

| Surface | Auth mechanism | Model entitlement checked |
|---------|---------------|--------------------------|
| GitHub.com Copilot Agent (browser) | Session cookie / GitHub.com login | GitHub servers check the seat directly |
| VS Code GitHub Copilot Chat | OAuth token issued to VS Code | Token must carry the correct scope + the seat must be active and synced |

The VS Code extension independently fetches a Copilot token from `api.github.com/copilot_internal/v2/token`. If that token does not include premium-model permissions (e.g., because the seat is on a **free trial that ended**, a **payment failed**, or an **org policy restricts model selection**), the model picker will not display Sonnet/Opus even though the GitHub.com interface still shows them from a cached or differently-scoped session.

---

## Quick Checklist

1. [ ] Correct GitHub account is signed into VS Code  
2. [ ] Copilot subscription is active (not trial-expired, not past-due)  
3. [ ] **GitHub Copilot** extension is installed and enabled  
4. [ ] **GitHub Copilot Chat** extension is installed and enabled  
5. [ ] Both extensions are up to date  
6. [ ] VS Code itself is up to date  
7. [ ] Model picker is enabled (`github.copilot.chat.modelPicker.enable`)  
8. [ ] No org/enterprise policy blocks model selection  
9. [ ] Not on a restrictive proxy/VPN that blocks Copilot token endpoints  

---

## Step-by-Step Resolution

### Step 1 – Verify the signed-in GitHub account in VS Code

1. Open **Command Palette** (`Ctrl`/`Cmd`+`Shift`+`P`).  
2. Run **Accounts: Show Accounts**.  
3. Confirm the account listed is the same one that has an active Copilot seat.  
4. If it is the wrong account:  
   - **Sign Out** from every GitHub entry.  
   - Re-run **GitHub: Sign In** and authenticate with the correct account.

> **Common cause:** You signed up for the Copilot trial on account A, but VS Code is signed into account B.

---

### Step 2 – Confirm your Copilot subscription status

Open GitHub in a browser and navigate to:

```
https://github.com/settings/copilot
```

Check the subscription line. You will see one of:

| Status shown | What it means | Action |
|---|---|---|
| **Active** (with next billing date) | Subscription is healthy | Proceed to Step 3 |
| **Free trial – ends \<date\>** | Trial is still running | Models should be available; if not, proceed to Step 3 |
| **Trial ended** / **No active plan** | Trial expired, no paid plan | Re-subscribe or add a payment method |
| **Past due** / **Payment failed** | Renewal charge was declined | Fix payment method (see Step 2a) |
| **Canceled** | Subscription was explicitly canceled | Re-subscribe |

Also check **Settings → Billing and plans** for invoices marked **failed** or **past due**.

#### Step 2a – Fix a failed payment (international transaction block)

If you disabled international transactions on your bank card after signing up:

1. **Re-enable** international transactions on your card (temporarily), *or* add a new card that allows international charges.  
2. Go to **Settings → Billing and plans → Payment methods** and update/add the card.  
3. Click **Retry payment** on any outstanding failed invoice.  
4. Once the invoice is paid, the subscription moves back to **Active** within a few minutes.  
5. Sign out of GitHub in VS Code and sign back in so the new token reflects the restored entitlement (see Step 4).

> GitHub's billing API charges in USD from a US entity, so your bank may classify it as an international transaction even for domestic accounts.

---

### Step 3 – Ensure both Copilot extensions are installed and enabled

In VS Code:

1. Open the **Extensions** panel (`Ctrl`/`Cmd`+`Shift`+`X`).  
2. Search for **GitHub Copilot** – install if missing, ensure it shows **Enabled**.  
3. Search for **GitHub Copilot Chat** – install if missing, ensure it shows **Enabled**.  
   - The model picker (Sonnet/Opus) requires the **Chat** extension; completions alone are not enough.  
4. Click the **⚙ gear icon → Check for Extension Updates** (or update all from the `...` menu).

> Minimum versions that include the model picker:
> - **GitHub Copilot** ≥ 1.196  
> - **GitHub Copilot Chat** ≥ 0.14  
>
> If your versions are older than these, update and reload VS Code before continuing.

---

### Step 4 – Hard-reset the Copilot session

This forces VS Code to request a fresh token and re-fetch entitlements:

1. Command Palette → **GitHub Copilot: Sign Out**  
2. Command Palette → **GitHub: Sign Out** (if the entry exists)  
3. Close **all** VS Code windows completely.  
4. Reopen VS Code.  
5. Command Palette → **GitHub: Sign In** → complete the browser OAuth flow.  
6. Command Palette → **GitHub Copilot: Sign In** (if prompted separately).  
7. Open the **Copilot Chat** panel and check the model picker again.

---

### Step 5 – Enable the model picker in VS Code settings

The model picker may be hidden behind a feature flag in some extension versions.

1. Open **Settings** (`Ctrl`/`Cmd`+`,`).  
2. Search for `copilot chat model`.  
3. Ensure **GitHub › Copilot › Chat: Model Picker Enabled** (or `github.copilot.chat.modelPicker.enable`) is **checked/enabled**.  

Alternatively, add the following to your `settings.json`:

```json
{
  "github.copilot.chat.modelPicker.enable": true
}
```

Save and reload the window (`Developer: Reload Window`).

---

### Step 6 – Check org/enterprise policy restrictions

If your Copilot seat is part of a **GitHub Organization** or **Enterprise**:

1. Ask your organization admin to check:  
   - **Organization Settings → Copilot → Policies** (or Enterprise → Policies → Copilot).  
   - Look for **"Allow members to use model selection"** or similar.  
   - If the policy is set to **Disabled** or **No policy (default off)**, members cannot switch models regardless of their plan.  
2. Admins can enable the policy via:  
   ```
   Organization → Settings → Copilot → Policies → Model selection → Enabled
   ```
3. Seat assignment: Confirm you are listed under **Organization → Settings → Copilot → Access → Seat management** as an assigned user. No seat = no Copilot access.

---

### Step 7 – Rule out proxy / VPN / SSL-inspection issues

If you are on a corporate network, VPN, or behind SSL inspection:

1. Temporarily disable the VPN / switch to a mobile hotspot.  
2. If Sonnet/Opus appear after disabling the VPN, the issue is endpoint blocking.  
3. Ask your IT/network team to allowlist the following Copilot endpoints:

   | Endpoint | Purpose |
   |----------|---------|
   | `api.github.com` | Token fetch, entitlement check |
   | `copilot-proxy.githubusercontent.com` | Copilot completions |
   | `*.githubcopilot.com` | Copilot Chat models |
   | `*.azure.com` (selected sub-domains) | Azure OpenAI / Anthropic endpoints used by Copilot |

4. If your proxy performs SSL inspection (MITM), VS Code certificate pinning for `api.github.com` can break token fetching. Ask IT to exclude those hosts from inspection or add their CA to VS Code's trust store via:

   ```json
   // settings.json
   "http.proxyStrictSSL": false
   ```
   *(Only use this as a temporary diagnostic measure; restore it once confirmed.)*

---

### Step 8 – Collect diagnostic logs

If none of the above resolves the issue, gather logs to identify the root cause:

1. **VS Code Output panel:**  
   - **View → Output** → select **GitHub Copilot** from the dropdown.  
   - Copy the last 50–100 lines around any error message.  
   - Repeat for **GitHub Copilot Chat** channel.

2. **Developer Console:**  
   - Command Palette → **Developer: Toggle Developer Tools** → **Console** tab.  
   - Look for lines containing `copilot`, `token`, `model`, or `entitlement`.

3. **Network tab (advanced):**  
   - In Developer Tools → **Network** → filter by `api.github.com/copilot`.  
   - Check the response body of `token` requests for the `models` or `skus` fields.

Paste these logs when filing a support ticket at [github.com/support](https://support.github.com) or in the [Copilot Community Forum](https://github.com/orgs/community/discussions/categories/copilot).

---

## Understanding Trial vs. Paid Model Access

| Plan | Sonnet / Opus available | Notes |
|------|------------------------|-------|
| **Copilot Free** (free tier) | No | Only GPT-4o mini / base models |
| **Copilot Pro (Individual)** | Yes, when subscription is active | Requires paid plan after trial |
| **Copilot Pro+ (Individual)** | Yes (premium quota) | Higher monthly usage allowance |
| **Copilot Business (Org seat)** | Subject to org policy | Admin must enable model selection |
| **Copilot Enterprise** | Subject to enterprise policy | Admin must enable model selection |
| **Free trial (any tier)** | Yes, during trial period | Access ends when trial expires or if payment auth fails |

> **GitHub Pro ≠ GitHub Copilot.** Having GitHub Pro (unlimited repos, Actions minutes, etc.) does *not* include a Copilot subscription. You need a separate Copilot plan or an assigned seat in an org.

---

## Frequently Asked Questions

**Q: I can select Sonnet/Opus on github.com but not in VS Code—why?**  
A: The github.com interface uses your browser session, which may reflect a cached or higher-privilege token. VS Code fetches a separate short-lived OAuth token. A mismatch usually means the VS Code token is stale or the seat entitlement changed since VS Code last authenticated. Sign out and back in (Step 4).

**Q: My trial just ended. Will I lose access immediately?**  
A: Yes, typically within minutes to a few hours after expiry. To restore access, add a valid payment method and start a paid plan. After the first successful charge, sign out of GitHub in VS Code and sign back in.

**Q: I disabled international transactions after paying. Will that affect my current subscription?**  
A: Your current billing period continues uninterrupted. The issue arises at the *next renewal date*: if your bank declines the charge, GitHub marks the subscription **Past due** and premium model access is suspended. Re-enable international transactions (or add a card that supports them) before the renewal date.

**Q: How do I know whether it's a subscription issue or an extension issue?**  
A: Run this command in your terminal (replace `TOKEN` with a fresh token from `gh auth token`):

```bash
curl -H "Authorization: token TOKEN" \
  https://api.github.com/copilot_internal/v2/token
```

Check the returned JSON for `"models"` or `"available_plans"`. If premium models are absent from the token response, it is a subscription/entitlement issue. If they are present in the token but missing in VS Code, it is an extension/settings issue.

**Q: The model picker doesn't appear at all in my Copilot Chat.**  
A: Make sure you have **GitHub Copilot Chat** ≥ 0.14 installed and `github.copilot.chat.modelPicker.enable` set to `true` in settings (see Step 5).

---

## Related Resources

- [GitHub Copilot billing documentation](https://docs.github.com/en/billing/managing-billing-for-github-copilot)
- [Configuring GitHub Copilot in VS Code](https://docs.github.com/en/copilot/using-github-copilot/using-github-copilot-in-your-ide)
- [Managing Copilot policies for your organization](https://docs.github.com/en/copilot/managing-copilot/managing-github-copilot-in-your-organization)
- [GitHub Support](https://support.github.com)
- [Copilot Community Discussions](https://github.com/orgs/community/discussions/categories/copilot)

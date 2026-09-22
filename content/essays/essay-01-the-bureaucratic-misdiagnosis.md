---
title: "The Most Expensive Sentence in Enterprise AI: \"We Have AI Governance\""
description: "Most organisations that believe they govern their AI are describing a fraction of the estate they actually run. The gap between the two is the real risk."
date: 2026-07-06
slug: the-bureaucratic-misdiagnosis
draft: false
---

There is a sentence that gets said in boardrooms with complete confidence, and it is almost always wrong in a specific, expensive way.

"We have AI governance."

It is usually true. There is a policy. There is a committee. There are technology provider certifications and a risk register and, increasingly, a responsible-AI statement with the right words in it. None of that is fake. That is exactly what makes the sentence dangerous — not because it is a lie, but because it is a true claim made over too small a surface.

## The misdiagnosis

Ask the organisation to inventory the AI it is actually running — not the strategic systems on the roadmap, but everything that is making, influencing, or accelerating a decision — and the register and the estate turn out to be different things.

The difference is not on any register. It is the customer-service assistant with write access to the CRM that a capable team shipped in three weeks because the official path would have taken three quarters. It is the analyst's notebook quietly pulling production data into an external model. It is the platform feature someone switched on inside a product you already owned, which nobody logged as an AI deployment because it arrived as a checkbox. It is the pilot that became a dependency because users liked it and no one wanted to be the person who took it away.

This is the pattern *Govern or Fail* calls the misdiagnosis problem: an organisation with real governance artefacts, honestly produced, mistaking those artefacts for coverage of the estate. The policy is real. The assumption that the policy describes the AI actually in production is not. It is not a false claim. It is a true claim made over too small a surface — surface-area error, not dishonesty.

It is worth being precise about why this happens, because it is not stupidity. The book names three biases, each of which feels like evidence of control:

- **Register bias** treats the inventory as a reflection of reality when it is a reflection of the discovery process. If discovery depends on project approval, procurement, or voluntary disclosure, the register will miss precisely the systems that bypassed those channels.
- **Category bias** defines AI too narrowly. It counts strategic models and approved pilots and misses embedded features, copilots, workflow automations, agentic scripts, retrieval assistants, and business-unit tools that influence real work without ever being labelled an AI programme.
- **Artefact bias** mistakes documentary compliance for operational governance — with the additional problem that the documents cover only the visible estate anyway.

Notice how they compound. A narrow definition of AI produces a narrow inventory. A narrow inventory makes the policy look more complete than it is. A complete-looking policy gives executives confidence the estate is under control, and that confidence removes the pressure to run a deeper discovery exercise. The loop closes neatly around the visible estate, and everyone inside it is behaving reasonably.

## What the evidence does and does not establish

The survey evidence points in this direction from several angles, and it is worth being careful about what each kind of evidence can carry.

Dataiku's 2026 CEO survey — commercially sponsored, and to be read as directional executive sentiment — reports that 96 percent of CEOs believe employees are using generative AI tools without approval. It reports executive belief; it does not independently measure the prevalence of that use ([source note 8](/source-notes.html)). BCG's 2025 *AI at Work* survey of 10,635 employees across 11 countries found 54 percent saying they would use AI tools their company had not authorised — a statement of intent, not of behaviour ([source note 18](/source-notes.html)). MIT Project NANDA, issued as preliminary findings rather than peer-reviewed research, describes a related tool-versus-enterprise pattern: consumer tools widely adopted for individual productivity while enterprise systems stall in formal workflows ([source note 17](/source-notes.html)).

CEOs expressing a belief about employee behaviour, employees describing what they would do, and a preliminary report documenting adoption patterns are three different kinds of evidence, and none of them independently establishes prevalence. What they establish is direction, which is enough to justify looking.

## Visibility is the first control

The governance implication is simpler than the evidence base. A register is only as reliable as the discovery process feeding it. If the inventory comes from approved projects, it misses employee tools. From procurement, it misses free tools and developer integrations. From architecture review, it misses embedded platform features activated inside existing platforms. From policy attestation, it misses whatever people use when policy slows them down.

Which is why visibility is not administrative housekeeping. It is the first control. An organisation cannot classify what it cannot find, assign ownership to systems it does not know exist, preserve evidence for workflows outside the production path, manage third-party exposure it has not identified, or enforce data boundaries around tools it has never reviewed.

A discovery exercise may expose an uncomfortable distance between the official account and the systems actually in use. That moment feels like failure and is nothing of the sort. Before it, the organisation is governing a picture. After it, it can start governing the estate. The risk had already existed; discovery made it actionable.

The organisations that handle AI well are not the ones that never find a gap. In any large estate, some amount of ungoverned AI should be assumed to be there already. They are the ones with the mechanisms and the appetite to find it before somebody else does.

## The only wrong answer is a flattering one

A better executive answer is less polished and considerably more useful. It does not say "we have an AI policy" — it says we have an AI policy, and we know which systems sit inside and outside its coverage. It does not say "our technology providers are certified" — it says technology provider controls are documented, and we know which uses remain outside the approved path. It does not say "we have an AI inventory" — it says the inventory is produced from multiple discovery paths, and we know which paths still have blind spots.

The better answer is not more confident. It is more falsifiable. That is the actual mark of governance maturity: the organisation can state what it knows, what it does not know, how it tells the difference, and what it is doing next.

The failure mode of enterprise AI is rarely that the model could not perform. The demo proves the model. Production tests the organisation around it — and the organisation is usually governing a picture of its estate rather than the estate itself.

None of this requires a new framework to see. It requires one act of institutional honesty: refusing to accept the confident sentence at face value, and going to look at what is actually running.

That is the entire discipline. The map is not the territory, and the register is not the estate.

---

*This is the diagnostic behind [Govern or Fail](/), a field report on why enterprise AI fails after the demo. The [companion resources](/resources/) carry the book's diagnostic tests — the customer challenge test, the technical control test, the four prerequisites, and the Chapter 11 scenario model — free and without an email gate.*

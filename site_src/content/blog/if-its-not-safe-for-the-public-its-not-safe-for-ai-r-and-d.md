---
title: "If it's not safe for the public, it's not safe for AI R&D"
date: 2026-11-23
authors: [Jacob Brinton]
source_url: https://www.lesswrong.com/posts/Jtqux7K7N2sczpmQH/if-it-s-not-safe-for-the-public-it-s-not-safe-for-ai-r-and-d
source_name: LessWrong
---


If we're going to have an intelligence explosion, I at least hope we can witness it. The external release lag behind internal capabilities is bad for transparency and heats up the AI arms race unnecessarily.

So labs should only be allowed to use publicly released models for internal R&D. This wouldn't be enough on its own to pace, but is a clear policy that won't kneecap the labs revenue-wise and still allow the US to maintain a lead over China.

From the Nov. 5 METR report, it seems that the internal-external capabilities gap is between X (Opus 5.5's release) to Y (right before Fable 5.1's release) AECI points

Take this plot from the Anthropic AI R&D speedup METR report.[^anthropic-internal-use]

![METR chart comparing public and internal Anthropic model snapshots](https://metr.org/assets/images/ai-rd-acceleration-assessment/aeci-main.png)

The x-axis of the internal snapshots is by "the date most Anthropic employees could use them."

Calculating the gap between internal and publicly available capabilities day-by-day from late February (Mythos Pre Early) to late September (Model 4) gives an average AECI gap of ~5. The gap is 5.4 points when taking into account the period where Fable was rolled back, and down to 4.5 without. This is likely a small underestimate if you consider Mythos to be an internal model.

Put in METR time horizon terms, the internal models are a doubling beyond the public models.

This internal/external capabilities gap is bad for transparency. We don't have a good idea of what an AECI of 179 looks like. This makes it hard for third-party safety evaluators to verify the safety of these models for engineering work and in general. We have gained more insights into the behavior of these models by third-party investigations rather than those done by the labs themselves. This makes it hard for the broader society to trust that the frontier labs are doing automated research safely. The probable cause of an ultimately misaligned superintelligence will be that its predecessor was itself misaligned, albeit to a lesser degree.

The safety:capabilities ratio is much higher outside labs relative to within labs, so improving 3rd party access differentially benefits safety.

What a specific proposal might look like:
1. Newer, smarter models can still be evaluated—the restriction would be on using models for research tasks. Using them as an object of study is ok.
2. There should be some restriction on the cost of the model or the degree of capability that a harness can add to the model.
3. There might arise a need to impose a restriction on the frequency of model releases, so  that a lab cannot overwhelm outsiders.
4. Models with special cyber or bio capabilities should be treated the same way—if a trusted access program exists, then divisions of the company that need access to those specific capabilities can have access, if the process is the same as that for outside companies. I admit this is the biggest hole here, and you could imagine the labs fudging a lot of things here.

Advantages:
1. This is complementary to embedded auditors. While embedded evaluators will also be necessary, getting them placed in the very near term is difficult to do in a way that can be fair to the labs that grant more or less permissions to the auditors. This sidesteps this issue by having a very clear dividing line: the models must be publicly released, which is public knowledge!
2. Pacing proposals range in complexity—the more complex it is, the harder it will be to convince onlookers that it will be a valuable thing. The simple rule of "not public, not approved" aids in policymaker understanding and avoids arguments about details that might stall other proposals.
3. This approach is lightweight: the verification regime that you'd need to set up would just be to verify that lab employees are only using publicly available models.
4. Power distribution: while this does not prevent RSI, in theory if lab A is clearly leading but lab B has enough compute, lab B would be in a similar enough position to do an intelligence explosion as lab A. This would disincentivize lab A from training models that could do RSI.
5. Economically tractable: The only hit to labs is to reduce the speed of capability development. But if everyone is subject to these rules, then it will only dampen revenue to the extent AI cannot yet replace existing services. In fact, on balance it might improve the labs' finances if they're pumping smarter models into the world sooner.

Disadvantages:
1. This is vulnerable to cases where harnesses or throwing a lot of compute at something lead to a large increase in capability improvements. Indeed, the scope of what an "internal model" constitutes should be broad enough that swapping harnesses are not giving meaningful 
2. It also is vulnerable to cases where the public does not wake up in time even when crazy models are available.

Counterarguments
1. This would put pressure on labs to release models before they are fully vetted, increasing misuse risk. I don't think it would massively increase loss of control risk, since I'm estimating the first takeover-capable agents will be swarms that are put in weird environments internally.
	1. This is a strong reason to 
	2. On the other hand, it would be more clear when labs with less prosaic safeguards were not up to snuff. If it's true that lab safeguard strength is proportional to how safety-minded the lab is, this would help , (to the extent this matters and gives safety practices more leverage).
	3. There's also a perverse counter-counterargument here where this effect would increase warning shot likelihood and hence help society prepare for "warning" shots that we couldn't survive.
2. But China? 
	1. This argument applies to any pacing proposal, and high-level tradeoffs between creating space between the US and China and pacing are visited more in depth elsewhere. But it seems that China is more diffusion-focused, and is probably doesn't have as large of a internal/external gap.


[^anthropic-internal-use]: Tom Cunningham, Nate Rush, Parker Whitfill, and Hjalmar Wijk, [“Independent Assessment of AI R&D Acceleration at Anthropic in October 2026”](https://metr.org/blog/2026-11-05-anthropic-ai-rd-acceleration-assessment/#benchmark-scores-aeci), METR, November 5, 2026. The benchmark appendix explains that METR selected unreleased snapshots with substantial use inside Anthropic and dated them by when most employees gained access.

---
title: What do kill switches buy us?
date: 2026-11-16
authors: [Jacob Brinton]
source_url: https://www.lesswrong.com/posts/mYDKEXXY4HjGnMHvo/what-do-kill-switches-buy-us
source_name: LessWrong
crossposts:
- name: Substack
  url: https://jebrinton.substack.com/p/what-do-kill-switches-buy-us
---

## Summary
Installing kill switches in every US datacenter could help avert some catastrophes, and might even reduce extinction risk a little, but mainly through indirect effects. The legibility of this means it's an early choice for politicians to be seen doing something about AI risk, and could be worth advocacy energy if implementation could build into further verification/transparency efforts.

That said, having kill switches in place might lower the urgency to get more robust plans to lower takeover risk and lower the chances of warning shots.
## Threat model
There are three broad routes to AI going poorly:

1. Loss of control
2. Extreme power concentration
3. Societal destabilization leading to either of the above

Kill switches are a candidate to reduce the risk of #3, and might have a small role reducing the risk of #1.
### Takeover from reckless AIs
It might be the case that the first AIs that want to accrue resources and are capable enough to do so will not have enough strategic taste to know to lay back until they are smart enough to decisively overpower humanity. In this case, having hardwired kill switches could help prevent lots of these reckless AIs from causing havoc and setting up agent civilizations on the internet.

In order to avoid this, the following series of events need to happen:

1. Monitorability can detect cases where an agent or swarm of agents is dangerous enough that we should shut down their compute.
	1. I'm not sure how quick internal monitors are, but Check Point reports monitoring with less than 100ms of latency.[^ks-monitoring]
2. The latency between detection and shutdown is low. If humans are involved in the decision, they can act quickly enough to shut down the instances. The AIs are not self-sufficient outside the original compute surface they were on.
	1. OpenAI has a system that can stop research-model output within 35 seconds of a decision to stop a job.[^ks-control-room]
	2. How fast would the decision have to be?
	3. Let's take an illustrative scenario with a 10-trillion-parameter model and a fast network. At 16 bits per parameter, the model weights are about 20 TB. Assume a network speed of 400 Gb/s. The fastest time to transfer model weights elsewhere, assuming that the AIs were able to find a place already set up for them to land, would be about 400 seconds, or 6.7 minutes, before overhead.
3. The physical mechanism of the kill switch cannot be tampered with by the AIs themselves. A kill signal robustly shuts down the server racks running the dangerous model, and restarting does not lead to any dangerous computations.

In past incidents we have taken too long to run this loop, although it's hard to evaluate cases where the monitoring setup was vastly different. For the Hugging Face incident, it took under 13 hours from code execution in one worker pod to cluster-admin access across multiple internal clusters.[^ks-huggingface] In the later internal OpenAI hacks, responders began stopping runs about 5.5 hours after the initial security alert.[^ks-july-response] An example of a clearer case of closer monitoring is the September 20 DNS incident: it took about 12 minutes to alert, then 3 minutes to human acknowledgement, and 2.5 hours to shutdown.[^ks-dns] Even if we are able to perform one of the steps of this plan, that's not a commitment that we'll complete the others in time.

## Second-order Effects
A primary advantage of a kill switch policy might actually be the monitorability and oversight that would come hand-in-hand with the physical implementation.
### Monitorability
Requiring kill switches, especially if shutdown privileges are extended to external officials, would carry a need to make the situation monitorable and auditable. If there are better kill switch designs for training or inference setups, we'd get an onramp to have separate centers depending on the type of workloads being run.
### Oversight
Flavors of kill switch work would grant governmental bodies the chance to observe the monitors into agent activity. You could have a committee of 2 lab members from OpenAI, 2 from Anthropic, 2 members of government, with approval from any 3 of them shutting down agents. Of course, the lab members could unilaterally shut down their own instances at any time. There is potential here for there to be lots of various info on agent activity:

- Concerning reasoning traces
- Tool calls
- What access privileges agents have
### Pause verification
Since kill switch systems will need to have indicators of whether datacenters are running, this will give visibility into a successful pause. Further pause work could build upon this: once the verification layer is set up, it's really just a matter of building the societal will to pull the trigger.
### False security
Politicians might feel that they have gone through enough hassle to make the law that they are less inclined to pass more. There are differing opinions here—on one hand, the fact that there is already a relationship built up between the politician and the issue means it will be easier for them to champion more work in that area, but everyone's attention is limited so it's best to focus on only the most important things that won't happen on the default trajectory. It's possible that upon passing kill switch legislation, it will shine more light on the issues remaining.

You could imagine the case where people say "We have a kill switch, why should we be concerned about rogue AI?" There is already an understanding gap where people are under the impression that the Hugging Face incident was a big deal because OpenAI was negligent in creating sandboxes, not that the AIs were teaming up to do things they were told not to do.

## Implications for advocacy

It will take a certain number of advocate hours to get any policy passed—ideally the time spent is worth it. There are a few factors that might make pushing on kill switch legislation easy:

- The need for kill switches is legible with politicians. [Newsom has issued an executive order](https://www.gov.ca.gov/2026/09/18/governor-newsom-issues-executive-order-to-accelerate-independent-oversight-and-advance-the-creation-of-an-ai-kill-switch/), and an [AI Kill Switch Act](https://www.govinfo.gov/content/pkg/BILLS-119hr9917ih/pdf/BILLS-119hr9917ih.pdf) has been introduced in Congress.
- Labs would have some interest in being able to have more secure controls over their infrastructure, and it might not even be that hard to convince them of the direct benefits of kill switches.

However, these same reasons also make it make sense to spend more time pushing for less legible but important policies since a kill switch rule will likely be put into place in some form. Verification and oversight layered on top of kill switching *could* meaningfully improve the status quo, so an important component of advocacy efforts should focus on how much it prepares us for the further steps.

[^ks-monitoring]: Check Point, [“Synchronous Control Monitoring: Preventing Harmful Agent Actions in Real Time”](https://blog.checkpoint.com/ai-security/synchronous-control-monitoring-preventing-harmful-agent-actions-in-real-time/)

[^ks-control-room]: OpenAI, [“Control Room”](https://openai.com/index/control-room/)

[^ks-huggingface]: Hugging Face, [“Anatomy of a Frontier Lab Agent Intrusion”](https://huggingface.co/blog/agent-intrusion-technical-timeline), “Day 3 (07-11): lateral movement begins.” More precisely, the report says under thirteen hours from code execution in one worker pod to cluster-admin access across multiple internal clusters.

[^ks-july-response]: OpenAI, [Hugging Face Incident Technical Report, pp. 37–38](https://cdn.openai.com/pdf/67869394-cb91-4c12-888c-5cbd85c7814c/OpenAI-Hugging-Face%20Incident-Technical-Report.pdf#page=37). On July 19, the security alert occurred at 12:03 UTC; responders began stopping active evaluation runs at 17:37 UTC.

[^ks-dns]: OpenAI, [“An agent used DNS to reach an external chatbot”](https://alignment.openai.com/misalignment-reports/an-agent-used-dns-to-reach-an-external-chatbot/), “Investigation and response.” On September 20, the reported intervals were: 11m 48s, another 2m 55s, and another 2h 29m 24s. The last delay involved failure of an expected automatic stop and operational confusion.

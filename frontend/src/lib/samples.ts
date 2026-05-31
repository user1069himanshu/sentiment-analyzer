export interface SampleCall {
  id: string;
  title: string;
  type: string;
  sentiment: "Positive" | "Negative" | "Neutral";
  description: string;
  transcript: string;
}

export const SAMPLE_CALLS: SampleCall[] = [
  {
    id: "resolved-outage",
    title: "Internet Outage — Resolved",
    type: "Technical Support",
    sentiment: "Positive",
    description: "Customer frustrated by outage, agent resolves and credits account.",
    transcript: `Agent: Thank you for calling BrightConnect, this is Priya. How can I help?
Customer: Hi, my internet has been down since yesterday and I work from home.
Agent: I'm so sorry about that. Let me pull up your account right away.
Customer: This is the second time this month. It's really affecting my work.
Agent: I completely understand, that's unacceptable. I can see the area outage is now resolved. Let me run a line test.
Customer: Okay, how long will that take?
Agent: About 30 seconds. And I'd like to credit your account for the downtime.
Customer: That would be great, thank you.
Agent: The line test came back clean. Can you try loading a website?
Customer: Yes, it's working now. Finally!
Agent: Wonderful. I've applied a two-day credit and flagged your account for priority support.
Customer: Thank you Priya, you've been very helpful.
Agent: My pleasure. Have a great day!`,
  },
  {
    id: "billing-dispute-angry",
    title: "Billing Dispute — Escalated",
    type: "Billing",
    sentiment: "Negative",
    description: "Customer disputes unexpected charge, agent unable to fully resolve.",
    transcript: `Agent: Thank you for calling support, this is Mark.
Customer: I need to speak to a manager right now. There's a $150 charge on my bill I never authorized.
Agent: I understand your frustration. Let me look at your account.
Customer: I've been a customer for 8 years and this is how you treat me? Unbelievable.
Agent: I sincerely apologize. I can see a charge from last month. It appears to be for a premium add-on.
Customer: I never ordered any add-on! Who authorized this?
Agent: I'm not able to determine that from my screen. I'd need to escalate this.
Customer: Every time I call I get passed around. This is ridiculous.
Agent: I understand. I'm creating a case number and our billing team will call within 48 hours.
Customer: 48 hours? I want this resolved today.
Agent: I'm sorry, I don't have the authority to reverse charges over $100. The billing team can.
Customer: This is the worst customer service I've ever experienced.
Agent: I truly apologize. Case number is B-29341. Is there anything else I can help with?
Customer: No. Just fix it.`,
  },
  {
    id: "successful-retention",
    title: "Retention — Churn Prevented",
    type: "Retention",
    sentiment: "Positive",
    description: "Customer calls to cancel, agent offers deal that keeps them.",
    transcript: `Agent: Hi, this is Sarah from retention. I understand you'd like to cancel today?
Customer: Yes, I've found a cheaper plan elsewhere.
Agent: I'm sorry to hear that. You've been with us for three years — let me see what I can do.
Customer: Unless you can match $40 per month, I'm leaving.
Agent: I completely understand. Let me check current offers for loyal customers.
Customer: I've already made up my mind honestly.
Agent: I appreciate your honesty. I can offer you our loyalty plan at $38 per month with 200 Mbps and free installation of our new router.
Customer: That's actually less than what I was quoted elsewhere.
Agent: We really value your loyalty and want to keep you as a customer.
Customer: Alright, that sounds fair. Let's do it.
Agent: Wonderful! I'll process that right now. You'll see the new rate on your next bill.
Customer: Thanks, I appreciate you working with me.
Agent: Thank you for staying with us!`,
  },
  {
    id: "tech-unresolved",
    title: "Technical Issue — Unresolved",
    type: "Technical Support",
    sentiment: "Negative",
    description: "Router keeps dropping, multiple troubleshooting steps fail.",
    transcript: `Agent: Good afternoon, tech support, this is James.
Customer: My router keeps dropping every couple of hours. It's been going on for two weeks.
Agent: I'm sorry to hear that. Let's troubleshoot. Can you restart the router for me?
Customer: I've restarted it probably 50 times already.
Agent: Understood. Let me run a remote diagnostic on your line.
Customer: Fine, but the last three agents tried that too.
Agent: The diagnostic shows some packet loss. Let's try a factory reset.
Customer: I've done that twice. It comes back for a day then drops again.
Agent: In that case the router might be faulty. I can schedule a technician.
Customer: The earliest appointment is next week, right? I've been told that before.
Agent: Actually our next available is in 9 days.
Customer: 9 days? I'm losing my mind here. I can't work like this.
Agent: I understand this is very disruptive. I'm escalating this as a priority case.
Customer: You said priority last time and nothing changed.
Agent: I sincerely apologize. I'll add notes that this requires same-week resolution.
Customer: I'll believe it when I see it.`,
  },
  {
    id: "new-customer-onboarding",
    title: "New Customer Setup",
    type: "Onboarding",
    sentiment: "Positive",
    description: "New customer gets guided through setup, happy with experience.",
    transcript: `Agent: Welcome to FiberFlow! This is Carlos. How can I make your first day great?
Customer: Hi! I just got installed today. I'm trying to figure out the app.
Agent: Congratulations on joining us! I'd be happy to walk you through it.
Customer: Great, I'm on the home screen now.
Agent: Perfect. Tap the WiFi icon at the top right — that's where you control your network.
Customer: Oh that's easy. Can I see how much bandwidth I'm using?
Agent: Absolutely. Go to Usage in the bottom menu. You can see real-time and monthly data there.
Customer: This is really intuitive. I love it.
Agent: I'm glad! Is there anything specific you were hoping to set up today?
Customer: I want parental controls for my kids.
Agent: Great feature. Go to Devices, tap any device, then toggle Bedtime Mode.
Customer: Found it. That's exactly what I needed.
Agent: Is there anything else I can help you with today?
Customer: No, this was perfect. Thank you Carlos!
Agent: Enjoy your new connection! We're here 24/7 if you need us.`,
  },
  {
    id: "refund-request",
    title: "Refund Request — Approved",
    type: "Billing",
    sentiment: "Positive",
    description: "Customer gets a full refund after service gap.",
    transcript: `Agent: Customer service, this is Nadia.
Customer: Hi, I'd like a refund for last month. The service was terrible during a critical time.
Agent: I'm sorry to hear that. Can you tell me more about what happened?
Customer: I had a video call with international investors and my connection dropped four times.
Agent: That's really unacceptable for something so important. I'm so sorry.
Customer: It cost me a lot professionally. I just want my money back for that month.
Agent: Absolutely. Looking at your account I can see multiple outage events last month.
Customer: Exactly. I documented them all.
Agent: You shouldn't have to do that. I'm going to issue a full monthly credit right now.
Customer: Really? I expected a fight.
Agent: You've been a loyal customer and the service failed you. That's on us.
Customer: I really appreciate that. Thank you.
Agent: Done. You'll see it on your next statement. I've also flagged your account for quality monitoring.
Customer: That's great. Thanks Nadia, you restored my faith.`,
  },
  {
    id: "angry-repeat-caller",
    title: "Repeat Caller — Frustrated",
    type: "Escalation",
    sentiment: "Negative",
    description: "Customer has called 5 times about the same issue with no resolution.",
    transcript: `Agent: Technical support, this is Tom.
Customer: This is my fifth call about the same issue. Fifth. Are you recording this?
Agent: Yes, all calls are recorded. I'm really sorry you're going through this.
Customer: Every agent promises it's fixed. It never is. My smart TV won't stay connected.
Agent: I can see your call history. That's completely unacceptable. Let me try a different approach.
Customer: What are you going to do that five other people haven't?
Agent: I'd like to bypass the standard steps and escalate directly to our tier 3 team.
Customer: Everyone says they're escalating. Nothing happens.
Agent: I hear your frustration. I'm going to stay on this call with you and conference in tier 3 right now.
Customer: Fine. But if this doesn't work I'm switching providers.
Agent: That's completely fair. Please hold while I get them on the line.
Customer: You're actually doing it right now?
Agent: Yes. Connecting now. Thank you for your patience.
Customer: Okay. I appreciate you not passing me off.`,
  },
  {
    id: "senior-patient",
    title: "Senior Customer — Patient Support",
    type: "Technical Support",
    sentiment: "Positive",
    description: "Agent patiently helps elderly customer set up email on tablet.",
    transcript: `Agent: Customer support, this is Lisa.
Customer: Hello dear, I hope I'm not bothering you. I'm not very good with technology.
Agent: Of course not! I'm here to help. What can I do for you today?
Customer: My grandson set up this tablet thing and I want to check my emails but I can't find them.
Agent: I'd love to help you with that. Can you tell me what you see on the screen right now?
Customer: There are a lot of little pictures.
Agent: Those are called apps. Do you see one that looks like an envelope?
Customer: Oh yes! A little envelope, yes I see it.
Agent: Perfect! Tap that gently.
Customer: Oh my goodness it opened. I can see all my messages!
Agent: You did it! How does that feel?
Customer: Oh this is wonderful. You're such a patient young lady.
Agent: It's my pleasure. Would you like me to show you how to reply to a message?
Customer: Yes please, if it's not too much trouble.
Agent: Not at all. This is exactly what I'm here for.`,
  },
  {
    id: "service-cancellation-failed",
    title: "Cancellation — Retention Failed",
    type: "Retention",
    sentiment: "Negative",
    description: "Customer determined to cancel, agent unable to retain.",
    transcript: `Agent: Retention department, this is Alex.
Customer: I'm calling to cancel my service effective immediately.
Agent: I'm sorry to hear that. Can I ask what's prompted this decision?
Customer: I've accepted a job in another country. I'm leaving in two weeks.
Agent: I understand. Is there anything we could do, like pause your account?
Customer: No, I won't be back. I need a clean cancellation.
Agent: Of course. I'm processing that now. I want to make sure there are no early termination fees.
Customer: There shouldn't be. My contract ended in March.
Agent: You're correct, no fees. Your service will end on the 30th.
Customer: Can you confirm I'll get a refund for the unused portion?
Agent: Yes, a prorated refund of $18.50 will be on your next statement.
Customer: Great. Can you email me a confirmation?
Agent: Absolutely. Sending that to your email on file now.
Customer: Thank you. It's been decent service overall.
Agent: We appreciate your time as a customer. Best of luck abroad!`,
  },
  {
    id: "speed-complaint",
    title: "Slow Speed — Partially Fixed",
    type: "Technical Support",
    sentiment: "Neutral",
    description: "Internet speed much lower than plan, partially improved after intervention.",
    transcript: `Agent: Technical support, this is Michael.
Customer: My internet speed is terrible. I'm paying for 500 Mbps and getting 50.
Agent: That's a significant difference. Let me check your line quality.
Customer: I ran the speed test three times this morning. Always around 50.
Agent: I can see some signal issues on our end. Let me push a firmware update to your modem.
Customer: Will that help?
Agent: It often does. It'll take about a minute.
Customer: Okay, running the test now. I'm getting 180 Mbps.
Agent: Better, but still not where it should be. I'd like to schedule a technician.
Customer: How soon?
Agent: Earliest is Wednesday.
Customer: Can I get a credit in the meantime?
Agent: Yes, I can apply a partial credit for the degraded service. Around $12.
Customer: That's something I guess. Okay, book Wednesday.
Agent: Done. Technician will be there between 10am and 2pm.`,
  },
  {
    id: "data-breach-concern",
    title: "Security Concern — Account Locked",
    type: "Security",
    sentiment: "Negative",
    description: "Customer panics over suspicious login, agent handles with urgency.",
    transcript: `Agent: Security team, this is Rachel.
Customer: I got an alert that someone logged into my account from Russia. I'm terrified.
Agent: I completely understand. Let's secure your account right now.
Customer: Please hurry. Do they have my payment info?
Agent: I'm locking the session immediately. Your payment data is encrypted and safe.
Customer: Are you sure? I've heard horror stories.
Agent: Yes, we use bank-grade encryption. Your card numbers are never stored in plain text.
Customer: How did they get in?
Agent: It appears someone used your email and a guessed password. I recommend a password change.
Customer: I'll do it right now. This is so scary.
Agent: I've terminated all active sessions. You'll need to log in fresh on all devices.
Customer: Done. Should I report this to anyone?
Agent: I've already filed an internal security report. You don't need to do anything else.
Customer: Thank you for acting so fast. I feel a bit better.
Agent: Of course. Is there anything else I can help you with?`,
  },
  {
    id: "upgrade-upsell",
    title: "Plan Upgrade — Successful Upsell",
    type: "Sales",
    sentiment: "Positive",
    description: "Customer calls about slow speeds, agent upsells to higher tier plan.",
    transcript: `Agent: Sales support, this is Dani.
Customer: Hi, I'm having speed issues. I'm on the basic plan.
Agent: I can see that. The 100 Mbps plan can get congested, especially in evenings.
Customer: That's exactly when it's slowest. What are my options?
Agent: We have a 500 Mbps plan for $15 more. For a household with streaming and gaming, it's a big difference.
Customer: My kids do stream and game constantly.
Agent: That plan would handle multiple 4K streams simultaneously with room to spare.
Customer: Does it come with a new router?
Agent: It does — our new mesh router for better coverage throughout your home.
Customer: That's the thing I really need. My office at the back gets no signal.
Agent: The mesh system would completely solve that. It extends coverage up to 3,000 sq ft.
Customer: Honestly that sounds amazing. Let's do it.
Agent: Great choice! I'll process the upgrade and ship the router within 2 business days.
Customer: You've sold me. Thank you!`,
  },
  {
    id: "transfer-frustration",
    title: "Multiple Transfers — Abandoned",
    type: "Escalation",
    sentiment: "Negative",
    description: "Customer transferred 3 times before getting wrong department again.",
    transcript: `Agent: Technical support, this is Ben.
Customer: Please don't transfer me again. I've been passed around for 45 minutes.
Agent: I'm so sorry. I promise to help you or find the exact right person. What's going on?
Customer: I need to change the account holder name after my divorce. It's a simple thing.
Agent: That actually goes through our accounts team, not technical support.
Customer: Oh my god. That's where I started.
Agent: I'm sorry. Let me personally conference in an accounts specialist right now instead of transferring.
Customer: If I get disconnected I'm not calling back.
Agent: I understand. I'm going to stay on the line with you. Give me 30 seconds.
Customer: This is such poor process. You'd think name changes would be common.
Agent: You're absolutely right and I'll be providing feedback on this. Connecting now.
Customer: Finally someone who isn't just passing me off.
Agent: Accounts specialist is joining. I'll stay on until you're all set.`,
  },
  {
    id: "outage-mass-event",
    title: "Mass Outage — Many Callers",
    type: "Technical Support",
    sentiment: "Neutral",
    description: "Area-wide outage, agent manages expectations professionally.",
    transcript: `Agent: Customer support, this is Jordan.
Customer: Is there an outage? My whole street is out.
Agent: Yes, we're aware of an infrastructure issue affecting your area. I'm sorry for the disruption.
Customer: When will it be fixed?
Agent: Our engineering team estimates 3-4 hours. It was caused by a fiber cut during road construction.
Customer: That's not your fault then.
Agent: We still feel responsible for your experience. I'm adding a bill credit automatically.
Customer: I appreciate that. Is there anything I can do in the meantime?
Agent: If you have a mobile hotspot that could work temporarily. I can also notify you via text when it's restored.
Customer: Text notification would be great.
Agent: Done. You'll receive a message when service is back. Is there anything else?
Customer: No, thanks for being upfront about it. Better than being left in the dark.
Agent: Absolutely. I'll make sure you're the first to know when we're back up.`,
  },
  {
    id: "competitor-comparison",
    title: "Competitor Comparison Call",
    type: "Retention",
    sentiment: "Positive",
    description: "Customer researching competitors, agent demonstrates value.",
    transcript: `Agent: Customer loyalty team, this is Hannah.
Customer: Hi, I'm just researching my options. I've been with you for two years.
Agent: Great! We love to hear from our loyal customers. What are you comparing?
Customer: SpeedMax is offering me 1 Gbps for $60 a month.
Agent: I can see why that's attractive. Let me look at what we can offer you.
Customer: I'm not unhappy with you, just want the best deal.
Agent: I respect that. Based on your usage, I can match 1 Gbps for $58 with our network guarantee.
Customer: You have a network guarantee?
Agent: Yes, if speeds drop below 80% of advertised, we credit you automatically. No calls needed.
Customer: SpeedMax didn't mention anything like that.
Agent: It's one of our key differentiators. Plus you'd keep your current setup.
Customer: True, the installation hassle is real. What about customer service?
Agent: We're rated 4.7 stars and have 24/7 specialist support, not offshore call centers.
Customer: You've given me a lot to think about. I'll probably stay.
Agent: I'll lock in that rate for you today so it's available if you decide.`,
  },
  {
    id: "payment-failure",
    title: "Payment Failed — Service Restored",
    type: "Billing",
    sentiment: "Positive",
    description: "Customer's card declined, service suspended, quickly resolved.",
    transcript: `Agent: Billing support, this is Kevin.
Customer: My internet was just cut off and I need it immediately for a work deadline.
Agent: Let me check your account quickly. I can see your payment declined yesterday.
Customer: What? My card should be fine. I just used it this morning.
Agent: It might be a temporary hold. Would you like to try again or use a different card?
Customer: Let me try again. Same card.
Agent: Processing now.
Customer: Did it go through?
Agent: Yes! Approved. I'm restoring your service right now.
Customer: Oh thank goodness. How long until it's back?
Agent: About 2 minutes. I'm also waiving the reconnection fee given the circumstances.
Customer: I didn't know there was a fee. Thank you.
Agent: The payment must have been held by your bank. Worth checking with them.
Customer: My connection is back! You're a lifesaver.
Agent: Happy to help. We've set up a payment reminder for next month too.`,
  },
  {
    id: "equipment-damage",
    title: "Damaged Equipment — Replacement",
    type: "Hardware",
    sentiment: "Neutral",
    description: "Customer's router was damaged by lightning, insurance process discussed.",
    transcript: `Agent: Hardware support, this is Diana.
Customer: My router was fried by a lightning strike during the storm last night.
Agent: I'm sorry about that. Is everyone safe?
Customer: Yes, just the router got it.
Agent: That's what matters. Let's get you sorted out. Are you covered under our equipment protection plan?
Customer: I'm not sure. I've been a customer for five years.
Agent: Let me check. You're on the standard plan, which doesn't include lightning protection unfortunately.
Customer: What are my options?
Agent: We can send a replacement router for $89, or you can rent one at $8 per month.
Customer: Is $89 the best you can do? It was an act of nature.
Agent: I understand. Let me check for goodwill exceptions given your tenure.
Customer: I appreciate that.
Agent: I can offer it at $45 given you've been with us five years and this was weather-related.
Customer: That's fair. Let's do it.
Agent: Great. I'll ship it overnight at no charge. Tracking number within the hour.`,
  },
  {
    id: "complaint-about-agent",
    title: "Agent Complaint — Handled Well",
    type: "Complaints",
    sentiment: "Positive",
    description: "Customer upset about previous rude agent, supervisor addresses it.",
    transcript: `Agent: Supervisor line, this is Patricia.
Customer: I need to file a complaint about an agent from yesterday. He was extremely rude.
Agent: I'm very sorry to hear that. Can you tell me what happened?
Customer: I asked a simple billing question and he talked to me like I was stupid. Then hung up on me.
Agent: That's completely unacceptable behavior. I want you to know I take this very seriously.
Customer: I've never been treated like that in my life.
Agent: I'm going to pull the call recording right now. Can you give me the approximate time?
Customer: Around 3pm yesterday.
Agent: Found it. I can see the interaction. You're absolutely right, that was unprofessional.
Customer: I just want an apology and for it not to happen to someone else.
Agent: On behalf of our company, I sincerely apologize. That agent will be addressed.
Customer: That's all I wanted to hear. Thank you for taking me seriously.
Agent: I'm applying a $30 credit to your account for the experience. You deserved better.
Customer: That wasn't necessary but thank you. I feel heard now.`,
  },
  {
    id: "proactive-service",
    title: "Proactive Service Call",
    type: "Proactive Support",
    sentiment: "Positive",
    description: "Agent calls customer to flag detected issues before they notice.",
    transcript: `Agent: Hi, this is Sam from FiberFlow proactive support. Is this Mr. Chen?
Customer: Yes, speaking. Is something wrong?
Agent: Nothing urgent, but our monitoring detected some unusual signal fluctuations on your line.
Customer: I haven't noticed anything.
Agent: They're subtle right now but could lead to intermittent drops within the next week or so.
Customer: Oh interesting. What can you do about it?
Agent: We'd like to schedule a tech to check the external line connections — at no charge.
Customer: You're calling me before it becomes a problem? That's different.
Agent: We'd rather prevent the frustration than react to it.
Customer: I really appreciate that. When can someone come?
Agent: We have Thursday or Friday morning. Any preference?
Customer: Thursday works. Thanks for the heads up.
Agent: Of course. You'll get a confirmation text. Have a great day!
Customer: You too. This is impressive service honestly.`,
  },
  {
    id: "international-roaming",
    title: "International Roaming — Unexpected Bill",
    type: "Billing",
    sentiment: "Negative",
    description: "Customer shocked by $300 roaming charges they didn't expect.",
    transcript: `Agent: Billing support, this is Emma.
Customer: I just got my bill and it's $340. That's three times my normal amount.
Agent: That must be a shock. Let me pull up the details right away.
Customer: I was in Canada for a week. I didn't think that would be an issue.
Agent: I can see $290 in international data charges. Did you get our roaming alert texts?
Customer: I got texts but I thought Canada was included like domestic.
Agent: Unfortunately Canada requires our international add-on. The texts detail the charges.
Customer: I had no idea. I never would have used data if I knew.
Agent: I understand the confusion. Many customers assume North American roaming is included.
Customer: Can you do anything? $290 is a lot for a mistake.
Agent: Since this is your first time traveling internationally with us, I can offer a one-time courtesy credit of $145.
Customer: That's half. What about the rest?
Agent: I'm not able to waive more without manager approval, which could take 48 hours.
Customer: Fine. But please add an international plan to my account so this never happens again.
Agent: Done. And I'll notate this so the manager sees context for the remaining credit request.`,
  },
];

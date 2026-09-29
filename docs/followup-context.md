# Follow-up context

Agent settings offers **Previous saved answer only** or **No previous context**, with the same project, conversation, per-agent and next-run inheritance as other settings. The default retains one previous completed turn. It is not complete conversation memory. Choosing no context changes the prompt, not the project's revision or saved edit snapshot.

Only a succeeded parent task's separate saved-answer file is used. There is no fallback to the raw execution log; failed/stopped output, diagnostic stderr and legacy tasks without saved answers are omitted. Reads refuse links/non-regular files and are bounded to the last 20,000 answer bytes plus the first 4,000 question bytes. The resulting JSON reference data is further bounded to 24,000 encoded bytes, shortening as necessary. Run details show inclusion/omission and shortening; missing or unsafe input becomes unavailable.

The exact included reference text is hashed into the execution approval fingerprint, including its source/mode metadata. If the eligible answer changes before approval or dispatch, the existing approval cannot authorize the changed prompt. Changing context settings refreshes affected pending approvals; running work keeps its existing invocation. Approval/audit records contain hashes and metadata, not the previous text.

The reference is JSON encoded, labelled untrusted and separated from the current instruction. This improves provenance and makes inclusion optional; it does not neutralize prompt injection. Previous model answers or user messages can contain hostile instructions. Tool, filesystem, egress, credential and publication controls remain the independent security boundary.

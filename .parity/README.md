# .parity — the programme's working state

`continuations.json` is the Stop hook's budget counter; `STOP` is the kill switch.

    touch .parity/STOP      # stand the continuation loop down
    rm .parity/STOP         # arm it again

Status itself is never stored here. It is derived from source on every run by
`scripts/parity-ledger.mjs`, because a status read back out of a file proves
nothing about the tree — which is exactly how two whole packs went missing.

`assigned.json` records which items an agent is already working, so the Stop
hook does not send this session at work that is in flight — colliding with it,
duplicating it, or both. Shape:

    { "WC-2": { "agent": "wc2-slots", "since": "2026-09-12T18:20:00Z" } }

An entry expires after four hours. That matters more than it looks: an
assignment for an agent that has since died would otherwise hide an item
forever, which is the exact failure this whole directory exists to prevent. An
expired entry returns its item to the actionable list AND is reported as
possibly-dead, rather than being silently dropped or silently kept.

All three files here are session state and are gitignored.

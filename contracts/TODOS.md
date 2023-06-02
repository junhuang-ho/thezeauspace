0. clear todos in /contracts
1. TEST "// set for control record" new code
2. implement a user facing "getNewNonce" for `Flow` & `Control` (after funding)
3. implement get "unsettledNonce" state on client facing side (after funding) - add to test
4. special fee data also need a range?
5. helper contracts that have single view function for each main session/flow function that returns boolean on weather can access or not (use this to "enable" frontend wagmi call to reduce number of calls to node provider)
6. TEST if have active flow, can open session as well? (& vice versa)

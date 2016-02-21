# node-tcp-hole-punching
Node.js script to demonstrate TCP hole punching through NAT


## How to

Run publicserver.js on a public server (not behind a NAT).

Run clientA.js on your first computer behind a NAT.

Run clientB.js on your second computer behind a (different) NAT.

Important: Run clientA.js first, run clientB.js second. (The only reason for this is that publicserver.js will show the correct debug messages).


Good Luck!
template Num2Bits(n) {
    signal input in;
    signal output out[n];
    var accum = 0;
    for (var i=0; i<n; i++) {
        out[i] <-- (in >> i) & 1;
        out[i] === out[i] * out[i];
        accum = accum + out[i] * (1 << i);
    }
    in === accum;
}

template LessThan(n) {
    signal input in[2];
    signal output out;

    component n2b = Num2Bits(n+1);

    n2b.in <== in[0] + (1 << n) - in[1];

    out <== 1 - n2b.out[n];
}

template GreaterEqThan(n) {
    signal input in[2];
    signal output out;

    component lt = LessThan(n);

    lt.in[0] <== in[1];
    lt.in[1] <== in[0] + 1;
    out <== lt.out;
}

template EligibilityCheck() {
    // Private inputs (not revealed)
    signal input income;
    signal input dependents;
    signal input salt;
    
    // Public inputs
    signal input incomeThreshold;    // e.g. 2000000 (Rp 2.000.000)
    signal input minDependents;      // e.g. 1
    
    // Output
    signal output eligible;
    
    // Constraints:
    // 1. income < incomeThreshold
    // 2. dependents >= minDependents
    // 3. eligible = 1 if both conditions met

    component lt = LessThan(32);
    lt.in[0] <== income;
    lt.in[1] <== incomeThreshold;

    component ge = GreaterEqThan(32);
    ge.in[0] <== dependents;
    ge.in[1] <== minDependents;

    // Both conditions must be met (logical AND: lt.out * ge.out)
    eligible <== lt.out * ge.out;
    
    // Use the salt
    signal saltSq;
    saltSq <== salt * salt;
}

// In circom 0.5.x, we cannot specify public inputs using the new 2.0.0 syntax.
// We just declare the main component here.
component main = EligibilityCheck();

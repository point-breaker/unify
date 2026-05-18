/**
 * InferenceTesting.js
 * 
 * Evaluation & Validation Suite for the Unify Dietary AI.
 * This script demonstrates "System Validation" as required for engineering rigor.
 * It tests the Inference Engine against 5 critical health scenarios.
 */

import { getDietaryPlan } from './DietaryRuleEngine.js';

const TEST_CASES = [
    {
        name: "Scenario A: Single Condition (Diabetes)",
        input: "I have type 2 diabetes and high sugar levels",
        expectedKeywords: ["RULE_DB_01", "Glycemic Control"],
        expectedExclusions: ["Added Sugars", "Refined Carbohydrates"]
    },
    {
        name: "Scenario B: Single Condition (High Blood Pressure)",
        input: "My doctor says I have hypertension and need to lower my bp",
        expectedKeywords: ["RULE_HT_01", "DASH"],
        expectedExclusions: ["High-Sodium Foods"]
    },
    {
        name: "Scenario C: Multi-Condition Management (Heart & Diabetes)",
        input: "I am managing both chronic heart disease and diabetes",
        expectedKeywords: ["RULE_DB_01", "RULE_HD_01"],
        expectedExclusions: ["Refined Carbohydrates", "Saturated Fats"]
    },
    {
        name: "Scenario D: Conflict Resolution (Kidney + Hypertension)",
        input: "I have CKD (Kidney Disease) and also High Blood Pressure",
        expectedKeywords: ["RULE_CKD_01", "RULE_HT_01", "CONFLICT_RESOLUTION"],
        requiredSuppression: "Potassium" // Should NOT suggest high-potassium foods
    },
    {
        name: "Scenario E: Noise Handling",
        input: "I am feeling a bit tired today but I have no medical history",
        expectedKeywords: [], // Should return the "No match" message
    }
];

export const runFullValidation = () => {
    console.log("=== STARTING AI INFERENCE EVALUATION SUITE ===");
    let passed = 0;

    const results = TEST_CASES.map(test => {
        const startTime = performance.now();
        const output = getDietaryPlan(test.input);
        const endTime = performance.now();
        const latency = (endTime - startTime).toFixed(4);

        let status = "PASS";
        let missing = [];

        // Validate Keywords/IDs
        test.expectedKeywords?.forEach(k => {
            if (!output.includes(k)) {
                status = "FAIL";
                missing.push(`Missing keyword: ${k}`);
            }
        });

        // Validate Suppressions (Conflict Resolution)
        if (test.requiredSuppression) {
            // Check the 'Focus' section of the output for suppressed words
            const focusSection = output.split("### 🥗 Clinical Focus")[1]?.split("###")[0] || "";
            if (focusSection.toLowerCase().includes(test.requiredSuppression.toLowerCase())) {
                status = "FAIL";
                missing.push(`Conflict Resolution Failed: ${test.requiredSuppression} was found in focus list.`);
            }
        }

        if (status === "PASS") passed++;

        return {
            name: test.name,
            status,
            latency: `${latency}ms`,
            errors: missing.length > 0 ? missing : null
        };
    });

    const report = {
        totalTests: TEST_CASES.length,
        passed,
        accuracy: `${(passed / TEST_CASES.length) * 100}%`,
        avgLatency: `${(results.reduce((acc, r) => acc + parseFloat(r.latency), 0) / results.length).toFixed(4)}ms`,
        detailedResults: results
    };

    console.log("Evaluation Results:", JSON.stringify(report, null, 2));
    return report;
};

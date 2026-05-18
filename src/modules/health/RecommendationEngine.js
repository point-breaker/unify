export const generateRecommendations = (heartRate, steps) => {
    const recommendations = [];

    // Heart Rate Logic
    if (heartRate > 100) {
        recommendations.push({
            type: 'alert',
            icon: 'Activity',
            title: 'High Heart Rate Detected',
            desc: `Your heart rate is ${heartRate} BPM. If you aren't exercising, try a 1-minute breathing exercise.`,
            action: 'Start Breathing'
        });
    } else if (heartRate < 60 && heartRate > 0) {
        recommendations.push({
            type: 'info',
            icon: 'Moon',
            title: 'Resting State',
            desc: 'Your metrics suggest you are in a deep rest state. Perfect time for meditation.',
            action: 'Meditate'
        });
    }

    // Step Logic (Mocking cumulative steps for this session)
    if (steps < 1000) {
        recommendations.push({
            type: 'warning',
            icon: 'Footprints',
            title: 'Keep Moving!',
            desc: "You're 2,000 steps away from your morning goal. A clear sky walk would be perfect.",
            action: 'View Route'
        });
    } else if (steps > 8000) {
        recommendations.push({
            type: 'success',
            icon: 'Trophy',
            title: 'Goal Crushed',
            desc: "Excellent work! You've hit your daily target. Hydrate well.",
            action: 'Log Water'
        });
    }

    // Default
    if (recommendations.length === 0) {
        recommendations.push({
            type: 'info',
            icon: 'Activity',
            title: 'Balanced Day',
            desc: 'Your vitals are stable. Maintain this rhythm.',
            action: 'View Trends'
        });
    }

    return recommendations;
};

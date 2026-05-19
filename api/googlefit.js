export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { token, startTimeMillis: clientStart, endTimeMillis: clientEnd } = req.body || {};
    if (!token) {
        return res.status(400).json({ error: 'Missing access token' });
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const startTimeMillis = clientStart || todayStart.getTime();
    const endTimeMillis = clientEnd || Date.now();

    try {
        // 1. Fetch High-Fidelity Merged Steps (Deduplicated estimated steps source)
        const stepsRes = await fetch("https://www.googleapis.com/fitness/v1/users/me/dataset/aggregate", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                aggregateBy: [{
                    dataTypeName: "com.google.step_count.delta",
                    dataSourceId: "derived:com.google.step_count.delta:com.google.android.gms:estimated_steps"
                }],
                startTimeMillis,
                endTimeMillis
            })
        });

        let steps = null;
        if (stepsRes.ok) {
            const stepsData = await stepsRes.json();
            const buckets = stepsData.bucket || [];
            let totalSteps = 0;
            let found = false;
            buckets.forEach(bucket => {
                const datasets = bucket.dataset || [];
                datasets.forEach(dataset => {
                    const points = dataset.point || [];
                    points.forEach(point => {
                        const val = point.value?.[0]?.intVal !== undefined 
                            ? point.value?.[0]?.intVal 
                            : point.value?.[0]?.fpVal;
                        if (val !== undefined) {
                            totalSteps += Math.round(val);
                            found = true;
                        }
                    });
                });
            });
            if (found) {
                steps = totalSteps;
            }
        } else {
            console.error("Steps fetch failed:", await stepsRes.text());
        }

        // Fallback to raw step counts if estimated steps stream is empty
        if (steps === null) {
            console.log("No estimated steps found, querying raw step count delta fallback...");
            const rawStepsRes = await fetch("https://www.googleapis.com/fitness/v1/users/me/dataset/aggregate", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    aggregateBy: [{
                        dataTypeName: "com.google.step_count.delta"
                    }],
                    startTimeMillis,
                    endTimeMillis
                })
            });
            if (rawStepsRes.ok) {
                const rawStepsData = await rawStepsRes.json();
                const buckets = rawStepsData.bucket || [];
                let totalSteps = 0;
                let found = false;
                buckets.forEach(bucket => {
                    const datasets = bucket.dataset || [];
                    datasets.forEach(dataset => {
                        const points = dataset.point || [];
                        points.forEach(point => {
                            const val = point.value?.[0]?.intVal !== undefined 
                                ? point.value?.[0]?.intVal 
                                : point.value?.[0]?.fpVal;
                            if (val !== undefined) {
                                totalSteps += Math.round(val);
                                found = true;
                            }
                        });
                    });
                });
                if (found) {
                    steps = totalSteps;
                }
            }
        }

        // 2. Fetch Real Heart Rate
        const hrRes = await fetch("https://www.googleapis.com/fitness/v1/users/me/dataset/aggregate", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                aggregateBy: [{
                    dataTypeName: "com.google.heart_rate.bpm"
                }],
                startTimeMillis,
                endTimeMillis
            })
        });

        let heartRate = null;
        if (hrRes.ok) {
            const hrData = await hrRes.json();
            const buckets = hrData.bucket || [];
            let hrSum = 0;
            let hrCount = 0;
            buckets.forEach(bucket => {
                const datasets = bucket.dataset || [];
                datasets.forEach(dataset => {
                    const points = dataset.point || [];
                    points.forEach(point => {
                        const val = point.value?.[0]?.fpVal !== undefined 
                            ? point.value?.[0]?.fpVal 
                            : point.value?.[0]?.intVal;
                        if (val !== undefined) {
                            hrSum += val;
                            hrCount++;
                        }
                    });
                });
            });
            if (hrCount > 0) {
                heartRate = Math.round(hrSum / hrCount);
            }
        } else {
            console.error("Heart rate fetch failed:", await hrRes.text());
        }

        // 3. Fetch Real Sleep (last 24h)
        const sleepRes = await fetch("https://www.googleapis.com/fitness/v1/users/me/dataset/aggregate", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                aggregateBy: [{
                    dataTypeName: "com.google.sleep.segment"
                }],
                startTimeMillis: startTimeMillis - (24 * 60 * 60 * 1000),
                endTimeMillis
            })
        });

        let sleep = null;
        let sleepQuality = null;
        if (sleepRes.ok) {
            const sleepData = await sleepRes.json();
            const buckets = sleepData.bucket || [];
            let totalSleepDurationMs = 0;
            buckets.forEach(bucket => {
                const datasets = bucket.dataset || [];
                datasets.forEach(dataset => {
                    const points = dataset.point || [];
                    points.forEach(p => {
                        const start = Number(p.startTimeNanos) / 1000000;
                        const end = Number(p.endTimeNanos) / 1000000;
                        totalSleepDurationMs += (end - start);
                    });
                });
            });
            if (totalSleepDurationMs > 0) {
                const hours = (totalSleepDurationMs / (1000 * 60 * 60)).toFixed(1);
                sleep = `${hours}h`;
                sleepQuality = Number(hours) > 7 ? 'Excellent' : 'Good';
            }
        } else {
            console.error("Sleep fetch failed:", await sleepRes.text());
        }

        return res.status(200).json({ steps, heartRate, sleep, sleepQuality });

    } catch (error) {
        console.error("Serverless Google Fit Sync Error:", error);
        return res.status(500).json({ error: 'Internal Server Error', message: error.message });
    }
}

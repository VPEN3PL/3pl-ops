{/* ✅ ACTIVE JOBS PANEL */}
<div className="active-bar">
  <h4>ACTIVE JOBS ({activeJobs})</h4>

  <div className="active-list">
    {jobs
      .filter(j => j.startTime && j.status === "Open")
      .map((job, i) => {
        const diff = timeNow - job.startTime;
        const minutes = Math.floor(diff / 60000);

        return (
          <div key={i} className="active-item">
            ⏳ {job.task} — {job.type} — {minutes}m
          </div>
        );
      })}
  </div>
</div>
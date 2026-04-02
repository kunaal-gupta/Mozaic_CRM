window.DashboardTab = function DashboardTab({ dashboard }) {
  if (!dashboard) return null;

  return (
    <>
      <div className="data-toolbar">
        <strong>Portfolio Snapshot</strong>
        <span>{dashboard.stats.deals} deals in motion</span>
      </div>
      <div className="kpi-row">
        {Object.entries(dashboard.stats).map(([label, value]) => (
          <article key={label} className="kpi-card">
            <p>{label.replaceAll("_", " ")}</p>
            <h3>{value}</h3>
          </article>
        ))}
      </div>
    </>
  );
};

function PipelineTab({ deals, STAGES, stageLabel, moveDeal }) {
  return (
    <div className="kanban-wrap">
      {STAGES.map((stage) => (
        <div key={stage} className="kanban-col">
          <div className="col-head"><h4>{stageLabel(stage)}</h4><span>{deals.filter((d) => d.stage === stage).length}</span></div>
          {deals.filter((d) => d.stage === stage).map((d) => (
            <article key={d.id} className="deal-card">
              <strong>{d.listing_address}</strong>
              <p>{d.contacts.map((c) => c.full_name).join(", ") || "No contacts"}</p>
              <div className="deal-actions">
                {STAGES.filter((s) => s !== stage).map((s) => (
                  <button key={s} onClick={() => moveDeal(d.id, s)}>{stageLabel(s)}</button>
                ))}
              </div>
            </article>
          ))}
        </div>
      ))}
    </div>
  );
}

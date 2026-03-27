const { useEffect, useMemo, useState } = React;

const STAGES = ["lead", "showing", "offer", "closed", "lost"];

const stageLabel = (stage) => stage.charAt(0).toUpperCase() + stage.slice(1);
const formatDate = (iso) => new Date(iso).toLocaleString();
const tabTitle = {
  dashboard: "Executive Dashboard",
  listing: "Listing Workbench",
  contacts: "Contacts",
  pipeline: "Deal Pipeline",
};
const tabSubtitle = {
  dashboard: "Track portfolio velocity, pipeline health, and team execution in one place.",
  listing: "Collaborate across notes, communications, and activity with listing-level context.",
  contacts: "Grow and manage high-value relationships with a clean, searchable directory.",
  pipeline: "Move opportunities forward with clear stage ownership and fast updates.",
};

function App() {
  const [tab, setTab] = useState("dashboard");
  const [dashboard, setDashboard] = useState(null);
  const [listings, setListings] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [deals, setDeals] = useState([]);
  const [selectedListing, setSelectedListing] = useState(null);
  const [listingDetail, setListingDetail] = useState(null);
  const [workflow, setWorkflow] = useState(null);
  const [loading, setLoading] = useState(false);
  const [newContact, setNewContact] = useState({ full_name: "", email: "", phone_number: "", company: "", professional_role: "buyer" });
  const [noteText, setNoteText] = useState("");
  const [search, setSearch] = useState("");

  const loadAll = async () => {
    setLoading(true);
    const [d, l, c, p] = await Promise.all([
      fetch("/api/dashboard/").then((r) => r.json()),
      fetch("/api/listings/").then((r) => r.json()),
      fetch("/api/contacts/").then((r) => r.json()),
      fetch("/api/deals/").then((r) => r.json()),
    ]);
    const w = await fetch("/api/workflow/").then((r) => r.json());
    setDashboard(d);
    setListings(l.results || []);
    setContacts(c.results || []);
    setDeals(p.results || []);
    setWorkflow(w);
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, []);

  const openListing = async (listingId) => {
    if (!listingId) return;
    const data = await fetch(`/api/listings/${listingId}/`).then((r) => r.json());
    setSelectedListing(listingId);
    setListingDetail(data);
    setTab("listing");
  };

  const createContact = async (e) => {
    e.preventDefault();
    await fetch("/api/contacts/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newContact),
    });
    setNewContact({ full_name: "", email: "", phone_number: "", company: "", professional_role: "buyer" });
    loadAll();
  };

  const moveDeal = async (dealId, stage) => {
    await fetch(`/api/deals/${dealId}/stage/`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage }),
    });
    loadAll();
    if (selectedListing) openListing(selectedListing);
  };

  const addNote = async (e) => {
    e.preventDefault();
    if (!selectedListing || !noteText.trim()) return;
    await fetch(`/api/listings/${selectedListing}/notes/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: noteText }),
    });
    setNoteText("");
    openListing(selectedListing);
  };

  const filteredListings = useMemo(() => {
    const term = search.toLowerCase().trim();
    if (!term) return listings;
    return listings.filter((l) => `${l.address} ${l.community}`.toLowerCase().includes(term));
  }, [listings, search]);

  return (

    <div className="layout">
      <aside className="sidebar">
        <div className="brand">
          <div className="dot" />
          <div>
            <h1>Mozaic CRM</h1>
            <p>Luxury Brokerage Suite</p>
          </div>
        </div>
        <div className="menu">
          {[
            ["dashboard", "Dashboard"],
            ["listing", "Listing Workbench"],
            ["contacts", "Contacts"],
            ["pipeline", "Pipeline"],
            ["workflow", "Workflow"],
          ].map(([key, label]) => (
            <button key={key} className={tab === key ? "active" : ""} onClick={() => setTab(key)}>
              {label}
            </button>
          ))}
        </div>
        <div className="sidebar-foot">
          <p>Workspace status</p>
          <strong>{loading ? "Syncing live data..." : "All systems operational"}</strong>
        </div>
      </aside>

      <main className="content">
        <header className="topbar">
          <div>
            <h2>{tabTitle[tab] || stageLabel(tab)}</h2>
            <p>{tabSubtitle[tab]}</p>
          </div>
          <div className="search-wrap">
            <input placeholder="Search listing address/community..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </header>

        {loading && <div className="loading">Syncing workspace...</div>}

        {tab === "dashboard" && dashboard && (
          <section className="panel-grid">
            {Object.entries(dashboard.stats).map(([label, value]) => (
              <article key={label} className="kpi">
                <p>{label.replaceAll("_", " ")}</p>
                <h3>{value}</h3>
              </article>
            ))}

            <article className="card wide">
              <div className="card-head"><h3>Pipeline Overview</h3><span>{dashboard.stats.deals} Total Deals</span></div>
              <div className="pipeline-mini">
                {dashboard.pipeline.map((item) => (
                  <div key={item.stage} className="stage-chip">
                    <strong>{item.count}</strong>
                    <span>{item.label || stageLabel(item.stage)}</span>
                  </div>
                ))}
              </div>
            </article>

            <article className="card wide">
              <div className="card-head"><h3>Listings Portfolio</h3><span>{filteredListings.length} Records</span></div>
              <div className="table">
                <div className="thead"><span>Address</span><span>Community</span><span>Beds/Baths</span><span>Actions</span></div>
                {filteredListings.length === 0 && <div className="empty">No listings found for this search.</div>}
                {filteredListings.map((l) => (
                  <div key={l.id} className="trow">
                    <span>{l.address}</span>
                    <span>{l.community}</span>
                    <span>{l.beds || "-"} / {l.baths || "-"}</span>
                    <span><button onClick={() => openListing(l.id)}>Open</button></span>
                  </div>
                ))}
              </div>
            </article>
          </section>
        )}

        {tab === "listing" && (
          <section className="panel-grid">
            <article className="card wide">
              <div className="card-head"><h3>Select Active Listing</h3><span>Live context workspace</span></div>
              <select onChange={(e) => openListing(e.target.value)} value={selectedListing || ""}>
                <option value="" disabled>Choose listing</option>
                {filteredListings.map((l) => <option key={l.id} value={l.id}>{l.address} ({l.community})</option>)}
              </select>
            </article>

            {listingDetail && (
              <>
                <article className="card">
                  <h3>Property Snapshot</h3>
                  <p className="muted">{listingDetail.listing.address}</p>
                  <h4>{listingDetail.listing.community}</h4>
                  <p>{listingDetail.listing.beds} beds • {listingDetail.listing.baths} baths • {listingDetail.listing.size} sqft</p>
                </article>

                <article className="card">
                  <h3>Linked Contacts</h3>
                  {listingDetail.contacts.length === 0 && <p className="muted">No contacts linked yet.</p>}
                  {listingDetail.contacts.map((c) => (
                    <div key={c.id} className="list-item">
                      <strong>{c.full_name}</strong>
                      <small>{c.professional_role} • {c.email}</small>
                    </div>
                  ))}
                </article>

                <article className="card wide">
                  <h3>Activity Timeline</h3>
                  {listingDetail.timeline.map((item) => (
                    <div key={item.id} className="timeline-item">
                      <span className={`pill ${item.type}`}>{item.type}</span>
                      <div>
                        <p>{item.description}</p>
                        <small>{formatDate(item.timestamp)}</small>
                      </div>
                    </div>
                  ))}
                </article>

                <article className="card">
                  <h3>Internal Notes</h3>
                  {listingDetail.notes.map((n) => <p key={n.id} className="note">{n.content}</p>)}
                  <form onSubmit={addNote} className="stack">
                    <textarea value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="Add execution notes for your team..." />
                    <button>Add Note</button>
                  </form>
                </article>

                <article className="card">
                  <h3>Comms Log</h3>
                  {listingDetail.communications.map((m) => (
                    <div key={m.id} className="list-item">
                      <strong>{m.type.toUpperCase()}</strong>
                      <small>{m.message}</small>
                    </div>
                  ))}
                </article>

                <article className="card">
                  <h3>Open Tasks</h3>
                  {(listingDetail.tasks || []).length === 0 && <p className="muted">No tasks assigned to this listing yet.</p>}
                  {(listingDetail.tasks || []).map((task) => (
                    <div key={task.id} className="list-item">
                      <strong>{task.title}</strong>
                      <small>{task.status} {task.due_date ? `• due ${formatDate(task.due_date)}` : ""}</small>
                    </div>
                  ))}
                </article>

                <article className="card">
                  <h3>Showings</h3>
                  {(listingDetail.showings || []).length === 0 && <p className="muted">No showing schedule found.</p>}
                  {(listingDetail.showings || []).map((showing) => (
                    <div key={showing.id} className="list-item">
                      <strong>{showing.status.toUpperCase()}</strong>
                      <small>{formatDate(showing.scheduled_at)}</small>
                    </div>
                  ))}
                </article>
              </>
            )}
          </section>
        )}

        {tab === "contacts" && (
          <section className="panel-grid contacts">
            <article className="card">
              <h3>New Contact</h3>
              <form onSubmit={createContact} className="stack">
                <input placeholder="Full name" value={newContact.full_name} onChange={(e) => setNewContact({ ...newContact, full_name: e.target.value })} required />
                <input placeholder="Email" type="email" value={newContact.email} onChange={(e) => setNewContact({ ...newContact, email: e.target.value })} required />
                <input placeholder="Phone" value={newContact.phone_number} onChange={(e) => setNewContact({ ...newContact, phone_number: e.target.value })} />
                <input placeholder="Company" value={newContact.company} onChange={(e) => setNewContact({ ...newContact, company: e.target.value })} />
                <select value={newContact.professional_role} onChange={(e) => setNewContact({ ...newContact, professional_role: e.target.value })}>
                  <option value="buyer">Buyer</option>
                  <option value="seller">Seller</option>
                  <option value="investor">Investor</option>
                </select>
                <button>Create Contact</button>
              </form>
            </article>

            <article className="card wide">
              <div className="card-head"><h3>Relationship Directory</h3><span>{contacts.length} Contacts</span></div>
              {contacts.length === 0 && <div className="empty">No contacts yet. Add your first relationship on the left.</div>}
              {contacts.map((c) => (
                <div key={c.id} className="trow compact">
                  <span><strong>{c.full_name}</strong></span>
                  <span>{c.professional_role}</span>
                  <span>{c.email}</span>
                </div>
              ))}
            </article>
          </section>
        )}

        {tab === "pipeline" && (
          <section className="kanban-wrap">
            {STAGES.map((stage) => (
              <div key={stage} className="kanban-col">
                <div className="card-head"><h3>{stageLabel(stage)}</h3><span>{deals.filter((d) => d.stage === stage).length}</span></div>
                {deals.filter((d) => d.stage === stage).length === 0 && <div className="empty">No deals in this stage.</div>}
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
          </section>
        )}

        {tab === "workflow" && workflow && (
          <section className="panel-grid">
            <article className="card">
              <div className="card-head"><h3>SuperAdmin Flow</h3><span>Governance</span></div>
              {workflow.superadmin_flow.map((step, idx) => (
                <div key={step} className="workflow-step">
                  <strong>{idx + 1}.</strong> <span>{step}</span>
                </div>
              ))}
            </article>
            <article className="card wide">
              <div className="card-head"><h3>Agent Execution Workflow</h3><span>Deal Lifecycle</span></div>
              {workflow.agent_flow.map((step, idx) => (
                <div key={step} className="workflow-step">
                  <strong>{idx + 1}.</strong> <span>{step}</span>
                </div>
              ))}
            </article>
            <article className="card wide">
              <div className="card-head"><h3>Stage Policy</h3><span>Controlled progression</span></div>
              <div className="pipeline-mini">
                {workflow.stage_policy.map((stage, idx) => (
                  <div key={stage} className="stage-chip">
                    <strong>{idx + 1}</strong>
                    <span>{stage}</span>
                  </div>
                ))}
              </div>
            </article>
          </section>
        )}
      </main>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);

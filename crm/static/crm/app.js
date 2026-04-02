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

const primaryRailItems = [
  { key: "dashboard", icon: "⌂", label: "Home" },
  { key: "contacts", icon: "👥", label: "Contacts" },
  { key: "listing", icon: "🏠", label: "Properties" },
  { key: "pipeline", icon: "💼", label: "Deals" },
];

const secondaryMenus = {
  dashboard: ["Overview", "Team feed", "Forecast"],
  contacts: ["People", "Organizations", "Timeline", "Merge duplicates"],
  listing: ["Listing workbench", "Inventory", "Showing notes"],
  pipeline: ["Kanban", "Deal history", "Stage rules"],
};

function App() {
  const [tab, setTab] = useState("contacts");
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
    <div className="app-shell">
      <aside className="primary-rail">
        <div className="logo">p</div>
        {primaryRailItems.map((item) => (
          <button
            key={item.key}
            className={`rail-btn ${tab === item.key ? "active" : ""}`}
            onClick={() => setTab(item.key)}
            title={item.label}
          >
            <span>{item.icon}</span>
            <small>{item.label}</small>
          </button>
        ))}
      </aside>

      <aside className="secondary-rail">
        <div className="crumb">Contacts / <strong>{stageLabel(tab)}</strong></div>
        <div className="menu-block">
          {(secondaryMenus[tab] || []).map((label, idx) => (
            <button key={label} className={`sub-item ${idx === 0 ? "active" : ""}`}>{label}</button>
          ))}
        </div>
        <div className="sidebar-foot">
          <p>Workspace status</p>
          <strong>{loading ? "Syncing live data..." : "All systems operational"}</strong>
        </div>
      </aside>

      <main className="workspace">
        <header className="global-topbar">
          <input
            className="global-search"
            placeholder="Search CRM"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="topbar-actions">
            <button className="ghost">+</button>
            <button className="primary">New</button>
          </div>
        </header>

        <section className="content-wrap">
          {loading && <div className="loading">Syncing workspace...</div>}

          {tab === "dashboard" && dashboard && (
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
          )}

          {tab === "contacts" && (
            <>
              <div className="data-toolbar">
                <button className="primary">+ Person</button>
                <span>{contacts.length} people</span>
              </div>
              <div className="table-shell">
                <div className="thead row contacts-row">
                  <span>Name</span><span>Organization</span><span>Email</span><span>Phone</span><span>Role</span>
                </div>
                {contacts.length === 0 && <div className="empty">No contacts yet</div>}
                {contacts.map((c) => (
                  <div key={c.id} className="row contacts-row">
                    <span>{c.full_name}</span>
                    <span>{c.company || "-"}</span>
                    <span><a href={`mailto:${c.email}`}>{c.email}</a></span>
                    <span>{c.phone_number || "-"}</span>
                    <span>{c.professional_role}</span>
                  </div>
                ))}
              </div>

              <form onSubmit={createContact} className="quick-form">
                <input placeholder="Full name" value={newContact.full_name} onChange={(e) => setNewContact({ ...newContact, full_name: e.target.value })} required />
                <input placeholder="Email" type="email" value={newContact.email} onChange={(e) => setNewContact({ ...newContact, email: e.target.value })} required />
                <input placeholder="Phone" value={newContact.phone_number} onChange={(e) => setNewContact({ ...newContact, phone_number: e.target.value })} />
                <button className="primary">Create</button>
              </form>
            </>
          )}

          {tab === "listing" && (
            <>
              <div className="data-toolbar">
                <select onChange={(e) => openListing(e.target.value)} value={selectedListing || ""}>
                  <option value="" disabled>Select listing</option>
                  {filteredListings.map((l) => <option key={l.id} value={l.id}>{l.address} ({l.community})</option>)}
                </select>
                <span>{filteredListings.length} listings</span>
              </div>

              <div className="table-shell">
                <div className="thead row listing-row">
                  <span>Address</span><span>Community</span><span>Beds/Baths</span><span>Action</span>
                </div>
                {filteredListings.map((l) => (
                  <div key={l.id} className="row listing-row">
                    <span>{l.address}</span>
                    <span>{l.community}</span>
                    <span>{l.beds || "-"} / {l.baths || "-"}</span>
                    <span><button onClick={() => openListing(l.id)}>Open</button></span>
                  </div>
                ))}
              </div>

              {listingDetail && (
                <div className="detail-grid">
                  <article className="panel">
                    <h4>Timeline</h4>
                    {listingDetail.timeline.map((item) => (
                      <div key={item.id} className="tiny-item">
                        <strong>{item.type}</strong>
                        <p>{item.description}</p>
                        <small>{formatDate(item.timestamp)}</small>
                      </div>
                    ))}
                  </article>
                  <article className="panel">
                    <h4>Notes</h4>
                    {listingDetail.notes.map((n) => <p key={n.id} className="note">{n.content}</p>)}
                    <form onSubmit={addNote} className="stack">
                      <textarea value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="Add note" />
                      <button>Add</button>
                    </form>
                  </article>
                </div>
              )}
            </>
          )}

          {tab === "pipeline" && (
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
          )}
        </section>
      </main>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);

const { useEffect, useMemo, useState } = React;

const STAGES = ["lead", "showing", "offer", "closed", "lost"];
const stageLabel = (stage) => stage.charAt(0).toUpperCase() + stage.slice(1);
const formatDate = (iso) => new Date(iso).toLocaleString();
const DashboardTab = window.DashboardTab;
const ContactsTab = window.ContactsTab;
const ListingsTab = window.ListingsTab;
const PipelineTab = window.PipelineTab;

const primaryRailItems = [
  { key: "dashboard", icon: "🏠", label: "Dashboard" },
  { key: "contacts", icon: "👥", label: "Contacts" },
  { key: "properties", icon: "🏡", label: "Properties" },
  { key: "deals", icon: "💰", label: "Deals" },
  { key: "activities", icon: "📅", label: "Activities" },
  { key: "tasks", icon: "✅", label: "Tasks" },
  { key: "showings", icon: "🏘️", label: "Showings" },
  { key: "email", icon: "📧", label: "Email" },
  { key: "settings", icon: "⚙️", label: "Settings" },
];

const secondaryMenus = {
  dashboard: ["Overview"],
  contacts: ["People", "Users", "Organizations"],
  properties: ["All Listings"],
  deals: ["All Deals", "Pipeline View"],
  activities: ["All Activities", "Timeline"],
  tasks: ["My Tasks", "All Tasks"],
  showings: ["All Showings", "Calendar View"],
  email: ["Templates", "Campaigns / Drips"],
  settings: ["Users", "Deal Stages", "System Config"],
};

function App() {
  const [tab, setTab] = useState("contacts");
  const [dashboard, setDashboard] = useState(null);
  const [listings, setListings] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [deals, setDeals] = useState([]);
  const [selectedListing, setSelectedListing] = useState(null);
  const [listingDetail, setListingDetail] = useState(null);
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
    setDashboard(d);
    setListings(l.results || []);
    setContacts(c.results || []);
    setDeals(p.results || []);
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

  if (!DashboardTab || !ContactsTab || !ListingsTab || !PipelineTab) {
    return <div className="empty">UI modules failed to load. Please refresh the page.</div>;
  }

  const activeView = tab === "properties" ? "listing" : tab === "deals" ? "pipeline" : tab;

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
        <div className="crumb">CRM / <strong>{stageLabel(tab)}</strong></div>
        <div className="menu-block">
          {(secondaryMenus[tab] || []).map((label, idx) => (
            <button key={label} className={`sub-item ${idx === 0 ? "active" : ""}`}>{label}</button>
          ))}
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

          {activeView === "dashboard" && <DashboardTab dashboard={dashboard} />}
          {activeView === "contacts" && (
            <ContactsTab
              contacts={contacts}
              newContact={newContact}
              setNewContact={setNewContact}
              createContact={createContact}
            />
          )}
          {activeView === "listing" && (
            <ListingsTab
              filteredListings={filteredListings}
              selectedListing={selectedListing}
              openListing={openListing}
              listingDetail={listingDetail}
              noteText={noteText}
              setNoteText={setNoteText}
              addNote={addNote}
              formatDate={formatDate}
            />
          )}
          {activeView === "pipeline" && (
            <PipelineTab deals={deals} STAGES={STAGES} stageLabel={stageLabel} moveDeal={moveDeal} />
          )}
          {activeView === "activities" && (
            <div className="data-toolbar"><strong>All Activities</strong><span>Timeline per contact/deal</span></div>
          )}
          {activeView === "tasks" && (
            <div className="data-toolbar"><strong>Tasks</strong><span>My Tasks and All Tasks (Tasks model)</span></div>
          )}
          {activeView === "showings" && (
            <div className="data-toolbar"><strong>Showings</strong><span>All Showings and Calendar View</span></div>
          )}
          {activeView === "email" && (
            <div className="data-toolbar"><strong>Email</strong><span>Templates and Campaigns / Drips</span></div>
          )}
          {activeView === "settings" && (
            <div className="data-toolbar"><strong>Settings</strong><span>Admin only: Users, Deal Stages, System Config</span></div>
          )}
        </section>
      </main>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);

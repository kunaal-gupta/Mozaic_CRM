const { useEffect, useMemo, useState } = React;

const STAGES = ["lead", "showing", "offer", "closed", "lost"];

function App() {
  const [tab, setTab] = useState("dashboard");
  const [dashboard, setDashboard] = useState(null);
  const [listings, setListings] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [deals, setDeals] = useState([]);
  const [selectedListing, setSelectedListing] = useState(null);
  const [listingDetail, setListingDetail] = useState(null);
  const [newContact, setNewContact] = useState({ full_name: "", email: "", phone_number: "", company: "", professional_role: "buyer" });
  const [noteText, setNoteText] = useState("");

  const loadAll = async () => {
    const [d, l, c, p] = await Promise.all([
      fetch("/api/dashboard/").then(r => r.json()),
      fetch("/api/listings/").then(r => r.json()),
      fetch("/api/contacts/").then(r => r.json()),
      fetch("/api/deals/").then(r => r.json()),
    ]);
    setDashboard(d);
    setListings(l.results || []);
    setContacts(c.results || []);
    setDeals(p.results || []);
  };

  useEffect(() => { loadAll(); }, []);

  const openListing = async (listingId) => {
    const data = await fetch(`/api/listings/${listingId}/`).then(r => r.json());
    setSelectedListing(listingId);
    setListingDetail(data);
    setTab("listing");
  };

  const createContact = async (e) => {
    e.preventDefault();
    await fetch("/api/contacts/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newContact)
    });
    setNewContact({ full_name: "", email: "", phone_number: "", company: "", professional_role: "buyer" });
    loadAll();
  };

  const moveDeal = async (dealId, stage) => {
    await fetch(`/api/deals/${dealId}/stage/`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage })
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
      body: JSON.stringify({ content: noteText })
    });
    setNoteText("");
    openListing(selectedListing);
  };

  return (
    <div className="shell">
      <header>
        <h1>Mozaic Real Estate CRM</h1>
        <p>Listing-centric workspace for agents, clients, and active deals.</p>
      </header>

      <nav>
        {[
          ["dashboard", "Dashboard"],
          ["listing", "Listing Detail"],
          ["contacts", "Contacts"],
          ["pipeline", "Deal Pipeline"],
        ].map(([key, label]) => (
          <button key={key} className={tab === key ? "active" : ""} onClick={() => setTab(key)}>{label}</button>
        ))}
      </nav>

      {tab === "dashboard" && dashboard && (
        <section className="grid stats">
          {Object.entries(dashboard.stats).map(([label, value]) => (
            <article key={label} className="card"><h3>{label.replaceAll("_", " ")}</h3><p>{value}</p></article>
          ))}
          <article className="card card-wide">
            <h3>Pipeline Overview</h3>
            <div className="pipeline-mini">
              {dashboard.pipeline.map(item => <div key={item.stage}><strong>{item.count}</strong><span>{item.stage}</span></div>)}
            </div>
          </article>
          <article className="card card-wide">
            <h3>Listings</h3>
            <ul className="listing-list">
              {listings.map(l => (
                <li key={l.id}>
                  <button onClick={() => openListing(l.id)}>{l.address}, {l.community}</button>
                </li>
              ))}
            </ul>
          </article>
        </section>
      )}

      {tab === "listing" && (
        <section className="grid listing-grid">
          <article className="card card-wide">
            <h3>Select Listing</h3>
            <select onChange={(e) => openListing(e.target.value)} value={selectedListing || ""}>
              <option value="" disabled>Choose a listing...</option>
              {listings.map(l => <option key={l.id} value={l.id}>{l.address} ({l.community})</option>)}
            </select>
          </article>
          {listingDetail && (
            <>
              <article className="card">
                <h3>Property Snapshot</h3>
                <p>{listingDetail.listing.address}</p>
                <p>{listingDetail.listing.beds} beds · {listingDetail.listing.baths} baths · {listingDetail.listing.size} sqft</p>
              </article>
              <article className="card">
                <h3>Contacts</h3>
                {listingDetail.contacts.map(c => <p key={c.id}>{c.full_name} — {c.professional_role}</p>)}
              </article>
              <article className="card card-wide">
                <h3>Timeline</h3>
                {listingDetail.timeline.map(item => <p key={item.id}>{item.type.toUpperCase()}: {item.description}</p>)}
              </article>
              <article className="card">
                <h3>Notes</h3>
                {listingDetail.notes.map(n => <p key={n.id}>{n.content}</p>)}
                <form onSubmit={addNote}><textarea value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="Add internal note..." /><button>Add Note</button></form>
              </article>
              <article className="card">
                <h3>Chat & Email</h3>
                {listingDetail.communications.map(m => <p key={m.id}>{m.type}: {m.message}</p>)}
              </article>
            </>
          )}
        </section>
      )}

      {tab === "contacts" && (
        <section className="grid contacts-grid">
          <article className="card">
            <h3>Add Contact</h3>
            <form onSubmit={createContact} className="stack">
              <input placeholder="Full name" value={newContact.full_name} onChange={(e) => setNewContact({ ...newContact, full_name: e.target.value })} required />
              <input placeholder="Email" type="email" value={newContact.email} onChange={(e) => setNewContact({ ...newContact, email: e.target.value })} required />
              <input placeholder="Phone" value={newContact.phone_number} onChange={(e) => setNewContact({ ...newContact, phone_number: e.target.value })} />
              <input placeholder="Company" value={newContact.company} onChange={(e) => setNewContact({ ...newContact, company: e.target.value })} />
              <select value={newContact.professional_role} onChange={(e) => setNewContact({ ...newContact, professional_role: e.target.value })}>
                <option value="buyer">Buyer</option><option value="seller">Seller</option><option value="investor">Investor</option>
              </select>
              <button>Create Contact</button>
            </form>
          </article>
          <article className="card card-wide">
            <h3>Contact Directory</h3>
            {contacts.map(c => <p key={c.id}><strong>{c.full_name}</strong> · {c.professional_role} · {c.email}</p>)}
          </article>
        </section>
      )}

      {tab === "pipeline" && (
        <section className="kanban-wrap">
          {STAGES.map(stage => (
            <div key={stage} className="kanban-col">
              <h3>{stage.toUpperCase()}</h3>
              {deals.filter(d => d.stage === stage).map(d => (
                <article key={d.id} className="deal-card">
                  <p><strong>{d.listing_address}</strong></p>
                  <p>{d.contacts.map(c => c.full_name).join(", ") || "No contacts"}</p>
                  <div className="deal-actions">
                    {STAGES.filter(s => s !== stage).map(s => <button key={s} onClick={() => moveDeal(d.id, s)}>{s}</button>)}
                  </div>
                </article>
              ))}
            </div>
          ))}
        </section>
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);

window.ListingsTab = function ListingsTab({
  filteredListings,
  selectedListing,
  openListing,
  listingDetail,
  noteText,
  setNoteText,
  addNote,
  formatDate,
}) {
  return (
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
  );
};

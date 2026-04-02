window.ListingsTab = function ListingsTab({
  filteredListings,
  selectedListing,
  openListing,
  listingDetail,
  noteText,
  setNoteText,
  addNote,
  formatDate,
  updateProperty // Assuming you have an update handler
}) {

  const handleUpdate = (id, field, value) => {
    updateProperty(id, { [field]: value });
  };

  return (
    <div className="listings-container">
      {/* TOOLBAR */}
      <div className="data-toolbar" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <select
            className="prop-edit"
            style={{ border: '1px solid #ddd', background: 'white', width: '250px' }}
            onChange={(e) => openListing(e.target.value)}
            value={selectedListing || ""}
          >
            <option value="" disabled>Search properties...</option>
            {filteredListings.map((l) => (
              <option key={l.property_id} value={l.property_id}>{l.address}</option>
            ))}
          </select>
          <span style={{ color: '#666', fontSize: '14px' }}>{filteredListings.length} Total Units</span>
        </div>
        <button className="primary">+ Add Inventory</button>
      </div>

      {/* MAIN TABLE */}
      <div className="table-shell">
        <div className="thead row property-row" style={{ background: '#f8fafc', fontWeight: '600', color: '#475569' }}>
          <span>Address & Status</span>
          <span>Community</span>
          <span>Builder/Year</span>
          <span>Fees ($)</span>
          <span>Beds</span>
          <span>Baths</span>
          <span>Size (sqft)</span>
          <span>Floors</span>
          <span>Basement/Dev</span>
          <span>Jr High</span>
          <span>Sr High</span>
          <span>Garage</span>
          <span>Legal/Lot</span>
          <span>Possession</span>
          <span>DOM/CDOM</span>
          <span>Added</span>
        </div>

        {filteredListings.map((l) => (
          <div key={l.property_id} className="row property-row" style={selectedListing === l.property_id ? { background: '#f0f7ff' } : {}}>

            {/* Address & Inventory Status */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <input className="prop-edit" style={{ fontWeight: '600' }} value={l.address} onChange={(e) => handleUpdate(l.property_id, 'address', e.target.value)} />
              {l.is_our_inventory && <span className="inventory-tag" style={{ width: 'fit-content' }}>OUR INVENTORY</span>}
            </div>

            {/* Community */}
            <input className="prop-edit" value={l.community} onChange={(e) => handleUpdate(l.property_id, 'community', e.target.value)} />

            {/* Builder & Year */}
            <div>
              <input className="prop-edit" placeholder="Builder" value={l.property_builder || ""} onChange={(e) => handleUpdate(l.property_id, 'property_builder', e.target.value)} />
              <input className="prop-edit" type="number" placeholder="Year" value={l.year_built || ""} onChange={(e) => handleUpdate(l.property_id, 'year_built', e.target.value)} />
            </div>

            {/* Condo Fees */}
            <input className="prop-edit" type="number" value={l.condo_fees || ""} onChange={(e) => handleUpdate(l.property_id, 'condo_fees', e.target.value)} />

            {/* Specs */}
            <input className="prop-edit" type="number" value={l.beds || ""} onChange={(e) => handleUpdate(l.property_id, 'beds', e.target.value)} />
            <input className="prop-edit" type="number" step="0.5" value={l.baths || ""} onChange={(e) => handleUpdate(l.property_id, 'baths', e.target.value)} />
            <input className="prop-edit" type="number" value={l.size || ""} onChange={(e) => handleUpdate(l.property_id, 'size', e.target.value)} />
            <input className="prop-edit" type="number" value={l.floors || ""} onChange={(e) => handleUpdate(l.property_id, 'floors', e.target.value)} />

            {/* Basement Info */}
            <div>
              <input className="prop-edit" placeholder="Basement" value={l.basement || ""} onChange={(e) => handleUpdate(l.property_id, 'basement', e.target.value)} />
              <input className="prop-edit" placeholder="Dev" value={l.basement_dev || ""} onChange={(e) => handleUpdate(l.property_id, 'basement_dev', e.target.value)} />
            </div>

            {/* Schools */}
            <input className="prop-edit" value={l.jr_high_school || ""} onChange={(e) => handleUpdate(l.property_id, 'jr_high_school', e.target.value)} />
            <input className="prop-edit" value={l.sr_high_school || ""} onChange={(e) => handleUpdate(l.property_id, 'sr_high_school', e.target.value)} />

            {/* Garage */}
            <input className="prop-edit" value={l.garage_type || ""} onChange={(e) => handleUpdate(l.property_id, 'garage_type', e.target.value)} />

            {/* Legal / Lot */}
            <div>
              <input className="prop-edit" placeholder="Plan" value={l.legal_plan || ""} onChange={(e) => handleUpdate(l.property_id, 'legal_plan', e.target.value)} />
              <input className="prop-edit" placeholder="Lot/Blk" value={l.block_lot || ""} onChange={(e) => handleUpdate(l.property_id, 'block_lot', e.target.value)} />
            </div>

            {/* Possession */}
            <input className="prop-edit" value={l.possession || ""} onChange={(e) => handleUpdate(l.property_id, 'possession', e.target.value)} />

            {/* DOM Metrics */}
            <div style={{ fontSize: '12px', color: '#64748b' }}>
              DOM: {l.dom || 0} / CDOM: {l.c_dom || 0}
            </div>

            {/* Date Added */}
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>
              {new Date(l.added_date).toLocaleDateString()}
            </div>
          </div>
        ))}
      </div>

      {/* DETAIL DRAWER (TIMELINE & NOTES) */}
      {listingDetail && (
        <div className="detail-grid" style={{ marginTop: '24px' }}>
          <article className="panel" style={{ borderLeft: '4px solid #6366f1' }}>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '18px' }}>🕒</span> Property Timeline
            </h4>
            <div className="timeline-container" style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {listingDetail.timeline.map((item) => (
                <div key={item.id} className="tiny-item">
                  <div style={{ fontWeight: 'bold', color: '#4a5568' }}>{item.type}</div>
                  <p style={{ fontSize: '13px', margin: '4px 0' }}>{item.description}</p>
                  <small style={{ color: '#a0aec0' }}>{formatDate(item.timestamp)}</small>
                </div>
              ))}
            </div>
          </article>

          <article className="panel" style={{ borderLeft: '4px solid #10b981' }}>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '18px' }}>📝</span> Internal Notes
            </h4>
            <div className="notes-stack" style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '15px' }}>
              {listingDetail.notes.map((n) => (
                <div key={n.id} className="note">
                  <p style={{ margin: 0, fontSize: '13px' }}>{n.content}</p>
                </div>
              ))}
            </div>
            <form onSubmit={addNote} className="stack">
              <textarea
                style={{ width: '100%', borderRadius: '8px', padding: '10px', border: '1px solid #ddd' }}
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Type a note about this property..."
              />
              <button className="primary" style={{ marginTop: '8px', width: '100%' }}>Save Note</button>
            </form>
          </article>
        </div>
      )}
    </div>
  );
};
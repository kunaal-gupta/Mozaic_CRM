window.ContactsTab = function ContactsTab({ contacts, newContact, setNewContact, createContact, updateContact }) {

  const handleUpdate = (id, field, value) => {
    updateContact(id, { [field]: value });
  };

  return (
    <div className="crm-module">
      <div className="data-toolbar" style={{ display: 'flex', justifyContent: 'space-between', padding: '12px' }}>
        <h2 style={{ fontSize: '18px' }}>Directory ({contacts.length})</h2>
        <button className="primary">+ New Contact</button>
      </div>

      <div className="table-shell">
        {/* HEADER */}
        <div className="thead row contacts-row" style={{ background: '#f8fafc', borderBottom: '2px solid #edf2f7', fontWeight: '600' }}>
          <span>Name</span>
          <span>Company</span>
          <span>Email</span>
          <span>Phone</span>
          <span>Type</span>
          <span>Assigned To</span>
          <span>Linked User</span>
          <span>Created By</span>
          <span>Timestamps (C/U)</span>
        </div>

        {/* DATA ROWS */}
        {contacts.map((c) => (
          <div key={c.id} className="row contacts-row">
            {/* Full Name */}
            <input className="editable-field" value={c.full_name} onChange={(e) => handleUpdate(c.id, 'full_name', e.target.value)} />

            {/* Company */}
            <input className="editable-field" placeholder="No Company" value={c.company || ""} onChange={(e) => handleUpdate(c.id, 'company', e.target.value)} />

            {/* Email */}
            <input className="editable-field" type="email" value={c.email} onChange={(e) => handleUpdate(c.id, 'email', e.target.value)} />

            {/* Phone Number */}
            <input className="editable-field" placeholder="Add phone..." value={c.phone_number || ""} onChange={(e) => handleUpdate(c.id, 'phone_number', e.target.value)} />

            {/* Type (Dropdown) */}
            <select className="editable-field" value={c.type} onChange={(e) => handleUpdate(c.id, 'type', e.target.value)}>
              <option value="buyer">Buyer</option>
              <option value="seller">Seller</option>
              <option value="investor">Investor</option>
            </select>

            {/* Assigned To */}
            <input className="editable-field" placeholder="Unassigned" value={c.assigned_to_display || ""} onChange={(e) => handleUpdate(c.id, 'assigned_to', e.target.value)} />

            {/* Linked User */}
            <input className="editable-field" placeholder="No linked user" value={c.linked_user_display || ""} onChange={(e) => handleUpdate(c.id, 'linked_user', e.target.value)} />

            {/* Created By (System Field - Read Only) */}
            <div className="metadata-cell">
              {c.created_by_display || 'System'}
            </div>

            {/* Timestamps (System Fields - Read Only) */}
            <div className="metadata-cell timestamp">
              <div title="Created At">C: {new Date(c.created_at).toLocaleDateString()}</div>
              <div title="Updated At" style={{ color: '#a0aec0' }}>U: {new Date(c.updated_at).toLocaleDateString()}</div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
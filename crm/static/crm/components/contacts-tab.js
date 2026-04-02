window.ContactsTab = function ContactsTab({ contacts, newContact, setNewContact, createContact }) {
  return (
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
  );
};

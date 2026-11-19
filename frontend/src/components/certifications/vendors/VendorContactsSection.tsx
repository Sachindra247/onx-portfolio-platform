import {
  normalizeVendorPhone,
  VENDOR_PHONE_ERROR,
} from "../../../utils/vendorPhoneNumber";

import { useEffect, useState } from "react";

import {
  createVendorContact,
  deleteVendorContact,
  getVendorContacts,
  updateVendorContact,
  type VendorContactDto,
} from "../../../api/vendorContactsApi";

interface VendorContactsSectionProps {
  vendorId: string;
  canManage: boolean;
}

export default function VendorContactsSection({
  vendorId,
  canManage,
}: VendorContactsSectionProps) {
  const [contacts, setContacts] = useState<VendorContactDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingContactId, setDeletingContactId] = useState<string | null>(
    null,
  );
  const [formError, setFormError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    let active = true;

    async function loadContacts() {
      setLoading(true);
      setError(null);

      try {
        const result = await getVendorContacts(vendorId);

        if (active) {
          setContacts(result);
        }
      } catch {
        if (active) {
          setError("Unable to load vendor contacts.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadContacts();

    return () => {
      active = false;
    };
  }, [vendorId]);

  function handleEditContact(contact: VendorContactDto) {
    setEditingContactId(contact.id);
    setName(contact.name);
    setJobTitle(contact.jobTitle ?? "");
    setEmail(contact.email ?? "");
    setPhone(contact.phone ?? "");
    setFormError(null);
    setShowForm(true);
  }

  async function handleDeleteContact(contact: VendorContactDto) {
    if (!canManage || saving || deletingContactId) {
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete ${contact.name}? This action cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    setDeletingContactId(contact.id);
    setError(null);

    try {
      await deleteVendorContact(vendorId, contact.id);

      setContacts((current) =>
        current.filter((item) => item.id !== contact.id),
      );

      if (editingContactId === contact.id) {
        resetForm();
      }
    } catch {
      setError("Unable to delete contact. Please try again.");
    } finally {
      setDeletingContactId(null);
    }
  }

  function resetForm() {
    setEditingContactId(null);
    setName("");
    setJobTitle("");
    setEmail("");
    setPhone("");
    setFormError(null);
    setShowForm(false);
  }

  async function handleAddContact(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canManage || saving) {
      return;
    }

    if (!name.trim()) {
      setFormError("Contact name is required.");
      return;
    }

    let normalizedPhone: string | null;

    try {
      normalizedPhone = normalizeVendorPhone(phone);
    } catch {
      setFormError(VENDOR_PHONE_ERROR);
      return;
    }

    setSaving(true);
    setFormError(null);

    try {
      const input = {
        name: name.trim(),
        jobTitle: jobTitle.trim() || null,
        email: email.trim() || null,
        phone: normalizedPhone,
      };

      if (editingContactId) {
        const updated = await updateVendorContact(
          vendorId,
          editingContactId,
          input,
        );

        setContacts((current) =>
          current
            .map((contact) => (contact.id === updated.id ? updated : contact))
            .sort((a, b) => a.name.localeCompare(b.name)),
        );
      } else {
        const created = await createVendorContact(vendorId, input);

        setContacts((current) =>
          [...current, created].sort((a, b) => a.name.localeCompare(b.name)),
        );
      }

      resetForm();
    } catch {
      setFormError("Unable to save contact. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="vendor-contacts">
      <div className="vendor-contacts__header">
        <h4>Vendor Contacts</h4>

        {canManage && !showForm && (
          <button type="button" onClick={() => setShowForm(true)}>
            + Add Contact
          </button>
        )}
      </div>

      {canManage && showForm && (
        <form className="vendor-contacts__form" onSubmit={handleAddContact}>
          <label>
            Contact Name *
            <input
              type="text"
              value={name}
              maxLength={200}
              required
              onChange={(event) => setName(event.target.value)}
            />
          </label>

          <label>
            Job Title
            <input
              type="text"
              value={jobTitle}
              maxLength={150}
              onChange={(event) => setJobTitle(event.target.value)}
            />
          </label>

          <label>
            Email
            <input
              type="email"
              value={email}
              maxLength={254}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>

          <label>
            Phone
            <input
              type="tel"
              value={phone}
              maxLength={50}
              placeholder="+1 (416) 555-0123"
              autoComplete="tel"
              onChange={(event) => {
                setPhone(event.target.value);

                if (formError === VENDOR_PHONE_ERROR) {
                  setFormError(null);
                }
              }}
            />
          </label>

          {formError && <p role="alert">{formError}</p>}

          <div className="vendor-contacts__actions">
            <button type="submit" disabled={saving}>
              {saving
                ? "Saving..."
                : editingContactId
                  ? "Update Contact"
                  : "Save Contact"}
            </button>

            <button type="button" disabled={saving} onClick={resetForm}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p>Loading contacts...</p>
      ) : error ? (
        <p role="alert">{error}</p>
      ) : contacts.length === 0 ? (
        <p>No contacts have been added for this vendor.</p>
      ) : (
        <div className="vendor-contacts__table-wrapper">
          <table className="vendor-contacts__table">
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Job Title</th>
                <th scope="col">Email</th>
                <th scope="col">Phone</th>
                <th scope="col">Last Updated</th>
                {canManage && <th scope="col">Actions</th>}
              </tr>
            </thead>

            <tbody>
              {contacts.map((contact) => (
                <tr key={contact.id}>
                  <td>
                    <strong>{contact.name}</strong>
                  </td>

                  <td>{contact.jobTitle || "—"}</td>

                  <td>
                    {contact.email ? (
                      <a href={`mailto:${contact.email}`}>{contact.email}</a>
                    ) : (
                      "—"
                    )}
                  </td>

                  <td className="vendor-contacts__phone">
                    {contact.phone ? (
                      <a href={`tel:${contact.phone}`}>{contact.phone}</a>
                    ) : (
                      "—"
                    )}
                  </td>

                  <td className="vendor-contacts__updated">
                    {contact.updatedAtUtc
                      ? new Date(contact.updatedAtUtc).toLocaleDateString(
                          "en-CA",
                        )
                      : "—"}
                  </td>

                  {canManage && (
                    <td>
                      <div className="vendor-contacts__item-actions">
                        <button
                          type="button"
                          disabled={saving || deletingContactId !== null}
                          onClick={() => handleEditContact(contact)}
                          aria-label={`Edit ${contact.name}`}
                          title="Edit contact"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          disabled={saving || deletingContactId !== null}
                          onClick={() => void handleDeleteContact(contact)}
                          aria-label={`Delete ${contact.name}`}
                          title="Delete contact"
                        >
                          {deletingContactId === contact.id
                            ? "Deleting..."
                            : "Delete"}
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

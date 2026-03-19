import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const API_URL = 'http://localhost:5002/api/forms';

export default function DashboardForms() {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [mode, setMode] = useState('list'); // 'list' or 'build'
  
  // Builder State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [fields, setFields] = useState([]);
  const [saving, setSaving] = useState(false);

  const fetchForms = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(API_URL);
      setForms(data);
    } catch (err) {
      console.error('Failed to fetch forms');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForms();
  }, []);

  const addField = (type) => {
    const newField = {
      id: `field_${Date.now()}`,
      type,
      label: `New ${type} question`,
      required: false,
      options: type === 'radio' || type === 'select' ? ['Option 1', 'Option 2'] : undefined
    };
    setFields([...fields, newField]);
  };

  const updateField = (id, key, value) => {
    setFields(fields.map(f => f.id === id ? { ...f, [key]: value } : f));
  };

  const removeField = (id) => {
    setFields(fields.filter(f => f.id !== id));
  };

  const handleSaveForm = async () => {
    if (!title) return alert('Title is required');
    if (fields.length === 0) return alert('Add at least one field');
    
    setSaving(true);
    try {
      await axios.post(API_URL, { title, description, fields });
      alert('Form created successfully!');
      setMode('list');
      fetchForms();
    } catch (err) {
      alert('Failed to save form.');
    } finally {
      setSaving(false);
    }
  };

  const copyLink = (uuid) => {
    navigator.clipboard.writeText(`http://localhost:3000/f/${uuid}`);
    alert('Link copied to clipboard!');
  };

  if (mode === 'build') {
    return (
      <div className="p-8 max-w-5xl mx-auto bg-white rounded-xl shadow-xl mt-10 border border-gray-100">
        <div className="flex justify-between items-center border-b pb-4 mb-6">
          <h1 className="text-2xl font-bold">Dynamic Form Builder</h1>
          <button onClick={() => setMode('list')} className="text-gray-500 hover:text-gray-800">Cancel</button>
        </div>

        <div className="space-y-4 mb-8">
          <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Form Title *" className="w-full text-2xl font-bold border-b-2 border-gray-200 focus:border-blue-500 outline-none pb-2 transition" />
          <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Description Overview (Optional)" className="w-full text-gray-600 border border-gray-200 rounded-lg p-3 outline-none focus:border-blue-500 transition" rows="2" />
        </div>

        <div className="space-y-6 mb-8">
          {fields.map((field) => (
            <div key={field.id} className="p-6 bg-gray-50 border border-gray-200 rounded-xl relative shadow-sm">
              <button 
                onClick={() => removeField(field.id)} 
                className="absolute top-4 right-4 text-red-500 font-extrabold hover:text-white hover:bg-red-500 p-1.5 rounded transition text-xs uppercase"
              >
                ✕ Remove
              </button>
              <div className="flex flex-col gap-4 pr-20">
                <input 
                  type="text" 
                  value={field.label} 
                  onChange={e => updateField(field.id, 'label', e.target.value)}
                  className="font-bold w-full md:w-3/4 p-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Question Label"
                />
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span className="bg-blue-100 px-3 py-1 rounded-md text-blue-800 font-extrabold uppercase text-[10px] tracking-wider">{field.type}</span>
                  <label className="flex items-center gap-2 cursor-pointer font-semibold">
                    <input type="checkbox" checked={field.required} onChange={e => updateField(field.id, 'required', e.target.checked)} className="w-4 h-4 text-blue-600 rounded" />
                    Mandatory Answer
                  </label>
                </div>
                
                {(field.type === 'radio' || field.type === 'select') && (
                  <div className="mt-2 bg-white p-4 border border-gray-200 rounded-lg shadow-inner">
                    <p className="text-xs font-bold uppercase text-gray-500 mb-2">Options (comma separated):</p>
                    <input 
                      type="text" 
                      value={field.options?.join(', ')} 
                      onChange={e => updateField(field.id, 'options', e.target.value.split(',').map(s=>s.trim()))}
                      className="w-full p-2.5 border border-gray-300 rounded-lg text-sm bg-gray-50 focus:bg-white transition outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Option 1, Option 2, Option 3"
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="bg-gray-100 p-5 rounded-xl border border-gray-200 flex flex-wrap gap-3 mb-8 items-center">
          <span className="block w-full text-xs font-black uppercase tracking-widest text-gray-400 mb-1">Inject Form Components:</span>
          <button onClick={() => addField('text')} className="px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:border-blue-500 transition font-medium text-gray-700">Text String</button>
          <button onClick={() => addField('textarea')} className="px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:border-blue-500 transition font-medium text-gray-700">Paragraph</button>
          <button onClick={() => addField('radio')} className="px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:border-blue-500 transition font-medium text-gray-700">Radio Choice</button>
          <button onClick={() => addField('select')} className="px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:border-blue-500 transition font-medium text-gray-700">Dropdown List</button>
          <button onClick={() => addField('number')} className="px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:border-blue-500 transition font-medium text-gray-700">Numerics</button>
        </div>

        <button onClick={handleSaveForm} disabled={saving} className="w-full py-4 text-white bg-green-600 hover:bg-green-700 font-extrabold rounded-xl shadow-lg transition">
          {saving ? 'Validating & Deploying...' : 'Export & Deploy Form Campaign'}
        </button>
      </div>
    );
  }

  // --- LIST MODE ---
  if (loading) return <div className="text-center pt-20">Loading schemas...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Campaign Schemas</h1>
          <p className="text-gray-500 mt-2 font-medium">Manage and instantiate your dynamic forms</p>
        </div>
        <div className="flex gap-4">
          <Link to="/dashboard" className="px-6 py-3 bg-white border border-gray-300 text-gray-800 rounded-xl hover:bg-gray-50 font-bold shadow-sm transition">Examine Submissions</Link>
          <button onClick={() => {
            setTitle(''); setDescription(''); setFields([]); setMode('build');
          }} className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold shadow-lg transition">+ Construct New Payload</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {forms.length === 0 && <div className="col-span-3 text-center py-16 bg-white rounded-xl shadow-sm text-gray-500 font-medium border border-dashed border-gray-300">No endpoints are currently live. Please construct one!</div>}
        {forms.map(form => (
          <div key={form.id} className="bg-white p-6 rounded-2xl shadow-md border border-gray-100 flex flex-col justify-between hover:shadow-xl transition transform hover:-translate-y-1">
            <div>
              <h3 className="font-extrabold text-xl text-gray-800 break-words">{form.title}</h3>
              <p className="text-sm text-gray-500 mt-2 line-clamp-2">{form.description || 'No meta description bound'}</p>
            </div>
            <div className="mt-8 border-t pt-4 flex justify-between items-center bg-gray-50 -mx-6 -mb-6 px-6 pb-6 rounded-b-2xl">
              <span className="bg-blue-100 text-blue-900 text-xs font-black tracking-wider uppercase px-3 py-1.5 rounded-md shadow-inner">{form.response_count} Hits</span>
              <button onClick={() => copyLink(form.uuid)} className="text-blue-600 hover:text-blue-800 text-sm font-bold bg-white px-3 py-1.5 rounded border border-blue-200 hover:border-blue-400 transition">Copy Trajectory Link</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

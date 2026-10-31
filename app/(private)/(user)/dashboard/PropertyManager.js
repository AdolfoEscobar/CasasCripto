"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import apiClient from "@/libs/api";
import { toast } from "react-hot-toast";
import { MAX_PROPERTY_IMAGES, imageSrc, normalizeImage } from "@/libs/propertyImages";
import { prepareImageForUpload } from "@/libs/clientImage";

const CRYPTO_OPTIONS = ["USDC", "USDT", "BTC", "ETH"];

const emptyForm = {
  title: "",
  description: "",
  city: "",
  state: "",
  country: "",
  location: "",
  price: "",
  currency: "USD",
  cryptoAccepted: [],
  // Array de fotos: objetos { src, srcSet, width, height } del uploader propio
  // o strings con URLs externas (legado + imágenes generadas con IA).
  images: [],
  contactEmail: "",
  contactPhone: "",
};

const STATUS_LABEL = {
  pending: { text: "En revisión", className: "badge-warning" },
  published: { text: "Publicado", className: "badge-success" },
  rejected: { text: "Rechazado", className: "badge-error" },
};

// Panel del dashboard de usuario para crear, editar y borrar sus propiedades.
// Las propiedades creadas quedan en "pending" hasta que un admin las revisa
// en /admin/dashboard/properties (ver app/api/properties/[id]/route.js).
const PropertyManager = ({ maxProperties = 1, featuredListing }) => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  // País/estado/ciudad son TODOS <select> cerrados (no texto libre), para
  // que los datos queden estandarizados desde que se crean y las URLs de
  // /propiedades/ciudad/[slug] no se dispersen en variantes como "CDMX",
  // "cdmx" y "Ciudad de México" siendo 3 valores distintos:
  // - País: lista completa (ver /api/geo/countries), mercados prioritarios
  //   (LatAm + España + EE. UU.) agrupados arriba.
  // - Estado/Provincia: solo aparece si el país elegido tiene subdivisiones
  //   en la base de datos (ver /api/geo/states). Cuando SÍ existen, es
  //   obligatorio elegir uno antes de poder elegir ciudad — así la lista de
  //   ciudades que se manda al navegador siempre es manejable (países
  //   grandes tienen miles de ciudades a nivel nacional).
  // - Ciudad: <select> con la lista completa de ciudades de ese
  //   país+estado (ver /api/geo/cities). `cityOptions` guarda esa lista.
  const [countries, setCountries] = useState([]);
  const [countryCode, setCountryCode] = useState("");
  const [states, setStates] = useState([]);
  const [stateCode, setStateCode] = useState("");
  const [cityOptions, setCityOptions] = useState([]);
  const [loadingCities, setLoadingCities] = useState(false);
  // Nombre del estado de la propiedad que se está editando, pendiente de
  // "traducirse" a un código de estado en cuanto llegue la lista de
  // estados de su país (ver efecto de abajo) — necesario porque el país y
  // sus estados se cargan de forma asíncrona al abrir el formulario de
  // edición.
  const [pendingEditState, setPendingEditState] = useState("");

  // Meta Model API (Muse Spark / Muse Image / SAM 3.1) — ver libs/metaModel.js.
  // Mientras no haya MODEL_API_KEY configurada, las 3 rutas de abajo
  // devuelven una respuesta "mock" claramente marcada (ver `data.mock`), así
  // que este panel funciona igual antes y después de que lleguen los
  // créditos del hackathon.
  // Número de fotos subiéndose en este momento (el envío del formulario se
  // bloquea hasta que llegue a 0 para no guardar el listado sin sus fotos).
  const [uploading, setUploading] = useState(0);
  // Campo chico para agregar una foto por URL externa (no ocupa upload).
  const [urlInput, setUrlInput] = useState("");
  const fileInputRef = useRef(null);

  const [aiNotes, setAiNotes] = useState("");
  const [aiCopyLoading, setAiCopyLoading] = useState(false);
  const [aiImagePrompt, setAiImagePrompt] = useState("");
  const [aiImageLoading, setAiImageLoading] = useState(false);
  const [aiPrivacyLoading, setAiPrivacyLoading] = useState(false);
  const [aiPrivacyResult, setAiPrivacyResult] = useState(null);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get("/properties/mine");
      setProperties(res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
    apiClient
      .get("/geo/countries")
      .then((res) => setCountries(res.data || []))
      .catch(() => {});
  }, []);

  // Al elegir país, busca sus estados/provincias (si tiene). Si no tiene,
  // el selector de estado simplemente no se muestra y la ciudad se carga
  // directamente a nivel país (ver efecto de abajo).
  useEffect(() => {
    setStateCode("");
    setCityOptions([]);
    if (!countryCode) {
      setStates([]);
      return;
    }
    apiClient
      .get(`/geo/states?country=${countryCode}`)
      .then((res) => setStates(res.data || []))
      .catch(() => setStates([]));
  }, [countryCode]);

  // Carga la lista COMPLETA de ciudades para llenar el <select> de Ciudad:
  // - Si el país tiene estados, espera a que se elija uno (listas de
  //   miles de ciudades a nivel país serían inmanejables en un <select>).
  // - Si el país NO tiene estados, carga directo a nivel país (nunca pasa
  //   de ~300 ciudades en ese caso — ver libs/geo.js).
  useEffect(() => {
    if (!countryCode || (states.length > 0 && !stateCode)) {
      setCityOptions([]);
      return;
    }
    setLoadingCities(true);
    apiClient
      .get(`/geo/cities?country=${countryCode}&state=${stateCode}`)
      .then((res) => setCityOptions(res.data || []))
      .catch(() => setCityOptions([]))
      .finally(() => setLoadingCities(false));
  }, [countryCode, stateCode, states.length]);

  // Al editar una propiedad, en cuanto llega la lista de estados de su
  // país, intenta ubicar el código correspondiente al nombre guardado para
  // que el <select> de Estado quede preseleccionado (y dispare la carga de
  // ciudades de ese estado).
  useEffect(() => {
    if (!pendingEditState) return;
    const match = states.find((s) => s.name === pendingEditState);
    if (match) setStateCode(match.code);
    setPendingEditState("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [states]);

  // Listas que alimentan los <select> de Estado/Ciudad, agregando el valor
  // ya guardado en la propiedad si no aparece en la lista oficial (puede
  // pasar con propiedades creadas antes de que estos campos fueran listas
  // cerradas, o con nombres cuya variante exacta no cubre la librería) —
  // así nunca se pierde o se "blanquea" un dato real al editar.
  const stateDropdownOptions = useMemo(() => {
    if (form.state && !states.some((s) => s.name === form.state)) {
      return [{ code: "__legacy__", name: form.state }, ...states];
    }
    return states;
  }, [states, form.state]);

  const cityDropdownOptions = useMemo(() => {
    if (form.city && !cityOptions.includes(form.city)) {
      return [form.city, ...cityOptions];
    }
    return cityOptions;
  }, [cityOptions, form.city]);

  const activeCount = properties.filter((p) => p.status !== "rejected").length;
  const atLimit = activeCount >= maxProperties && !editingId;

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
    setCountryCode("");
    setStateCode("");
    setCityOptions([]);
    setPendingEditState("");
    setUrlInput("");
  };

  const startEdit = (property) => {
    setForm({
      title: property.title || "",
      description: property.description || "",
      city: property.city || "",
      state: property.state || "",
      country: property.country || "",
      location: property.location || "",
      price: property.price ?? "",
      currency: property.currency || "USD",
      cryptoAccepted: property.cryptoAccepted || [],
      images: Array.isArray(property.images) ? property.images : [],
      contactEmail: property.contactEmail || "",
      contactPhone: property.contactPhone || "",
    });
    // Mejor esfuerzo para reactivar los <select> de estado/ciudad de esa
    // propiedad al editar — si no encuentra el código (dato viejo/distinto),
    // el usuario puede simplemente re-elegir el país y los demás campos se
    // acomodan solos (ver efectos arriba, y stateDropdownOptions/
    // cityDropdownOptions para no perder valores que no matcheen).
    const match = countries.find((c) => c.name === property.country);
    setCountryCode(match?.code || "");
    setPendingEditState(property.state || "");
    setEditingId(property.id);
    setShowForm(true);
  };

  const toggleCrypto = (symbol) => {
    setForm((f) => ({
      ...f,
      cryptoAccepted: f.cryptoAccepted.includes(symbol)
        ? f.cryptoAccepted.filter((c) => c !== symbol)
        : [...f.cryptoAccepted, symbol],
    }));
  };

  // Sube fotos a Vercel Blob (POST /api/uploads), de una en una y directo al
  // elegirlas — NO al enviar el formulario. Cada archivo se pre-comprime en
  // el navegador (ver libs/clientImage.js) para no rebasar el límite de 4.5MB
  // por request de las serverless functions. Los fallos se reportan por foto
  // y no tumban el resto del lote.
  const handleFiles = async (e) => {
    const files = [...(e.target.files || [])];
    e.target.value = "";
    if (files.length === 0) return;

    const room = MAX_PROPERTY_IMAGES - form.images.length;
    if (room <= 0) {
      toast.error(`Máximo ${MAX_PROPERTY_IMAGES} fotos por propiedad`);
      return;
    }
    const batch = files.slice(0, room);
    if (files.length > room) {
      toast.error(
        `Solo se tomaron ${room} de ${files.length}: máximo ${MAX_PROPERTY_IMAGES} fotos`
      );
    }

    setUploading((n) => n + batch.length);
    try {
      for (const file of batch) {
        try {
          const prepared = await prepareImageForUpload(file);
          const data = new FormData();
          data.append("file", prepared);
          const res = await apiClient.post("/uploads", data);
          setForm((f) =>
            f.images.length >= MAX_PROPERTY_IMAGES
              ? f
              : { ...f, images: [...f.images, res.data] }
          );
        } catch (err) {
          // Errores del API (4xx/5xx) ya los muestra apiClient con toast;
          // aquí solo cubrimos los errores locales de pre-compresión.
          if (!err?.response) {
            toast.error(err?.message || "No pudimos leer esa imagen");
          }
        }
      }
    } finally {
      setUploading((n) => n - batch.length);
    }
  };

  const removeImage = (index) => {
    setForm((f) => ({ ...f, images: f.images.filter((_, i) => i !== index) }));
  };

  // Reordenar fotos: la primera del array es la portada en todas partes
  // (tarjeta, detalle, OpenGraph — ver components/PropertyCard.js), así que
  // mover una foto al primer lugar ES cambiar la foto principal.
  const moveImage = (from, to) => {
    if (from === to || from == null || to == null) return;
    setForm((f) => {
      if (
        from < 0 ||
        to < 0 ||
        from >= f.images.length ||
        to >= f.images.length
      ) {
        return f;
      }
      const images = [...f.images];
      const [moved] = images.splice(from, 1);
      images.splice(to, 0, moved);
      return { ...f, images };
    });
  };

  const makeCover = (index) => {
    if (index === 0) return;
    moveImage(index, 0);
  };

  // Arrastre nativo HTML5 (sin librerías): el índice arrastrado vive en un
  // ref (no pinta nada) y el destino en estado (resalta dónde se soltará).
  // `lastDragEnd` evita que un arrastre soltado sobre la misma foto dispare
  // además el clic de "poner de portada".
  const dragIndexRef = useRef(null);
  const lastDragEndRef = useRef(0);
  const [dropTarget, setDropTarget] = useState(null);

  // Agrega una foto por URL externa (sin subir nada): útil para imágenes
  // generadas con IA en otro lado o fotos ya publicadas. No genera variantes
  // responsive — para eso está el uploader de arriba.
  const addImageUrl = () => {
    const url = urlInput.trim();
    if (!url) return;
    if (!/^https?:\/\/.+/.test(url)) {
      toast.error("Pega una URL válida (https://...)");
      return;
    }
    if (form.images.length >= MAX_PROPERTY_IMAGES) {
      toast.error(`Máximo ${MAX_PROPERTY_IMAGES} fotos por propiedad`);
      return;
    }
    setForm((f) => ({ ...f, images: [...f.images, url] }));
    setUrlInput("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      !form.title ||
      !form.country ||
      !form.city ||
      !form.price ||
      (states.length > 0 && !form.state)
    ) {
      toast.error(
        states.length > 0
          ? "Título, país, estado/provincia, ciudad y precio son obligatorios"
          : "Título, país, ciudad y precio son obligatorios"
      );
      return;
    }

    if (uploading > 0) {
      toast.error("Espera a que terminen de subirse las fotos");
      return;
    }

    setSaving(true);
    const payload = {
      ...form,
      // Normaliza espacios por si acaso (las opciones del <select> ya
      // vienen con la capitalización correcta de la librería de ciudades).
      city: form.city.trim().replace(/\s+/g, " "),
      state: form.state.trim(),
      country: form.country.trim(),
      price: Number(form.price),
      // El array de fotos ya viene armado (uploader + URLs); el servidor lo
      // sanea y lo recorta al máximo (ver libs/propertyImages.js).
      images: form.images,
    };

    try {
      if (editingId) {
        await apiClient.patch(`/properties/${editingId}`, payload);
        toast.success("Propiedad actualizada. Vuelve a quedar en revisión.");
      } else {
        await apiClient.post("/properties", payload);
        toast.success("¡Propiedad enviada! Un admin la revisará pronto.");
      }
      resetForm();
      fetchProperties();
    } catch (e) {
      // apiClient already toasts the error message
    } finally {
      setSaving(false);
    }
  };

  const [featuring, setFeaturing] = useState(null);

  const handleFeature = async (propertyId) => {
    setFeaturing(propertyId);
    try {
      const res = await apiClient.post("/stripe/create-featured-listing", {
        propertyId,
        successUrl: window.location.href,
        cancelUrl: window.location.href,
      });
      window.location.href = res.url;
    } catch (e) {
      // apiClient already toasts the error
      setFeaturing(null);
    }
  };

  // Muse Spark: redacta título + descripción en español a partir de notas
  // crudas del propietario + los datos ya elegidos en el formulario
  // (ciudad/país/precio/criptos). El resultado SIEMPRE se puede editar antes
  // de enviar — nunca se publica directo.
  const handleGenerateCopy = async () => {
    if (!form.city || !form.country || !form.price) {
      toast.error("Elige país, ciudad y precio antes de usar Meta AI");
      return;
    }
    setAiCopyLoading(true);
    try {
      const res = await apiClient.post("/ai/listing-copy", {
        rawNotes: aiNotes,
        city: form.city,
        state: form.state,
        country: form.country,
        price: form.price,
        currency: form.currency,
        cryptoAccepted: form.cryptoAccepted,
      });
      setForm((f) => ({
        ...f,
        title: res.data.title,
        description: res.data.description,
      }));
      toast.success(
        res.data.mock
          ? "Copy de muestra generado (conecta MODEL_API_KEY para usar Muse Spark real)"
          : "Copy generado con Meta Muse Spark"
      );
    } catch (e) {
      // apiClient already toasts the error
    } finally {
      setAiCopyLoading(false);
    }
  };

  // Muse Image: genera una foto del listado a partir de un prompt y la
  // agrega como URL externa (el dueño puede quitarla si no le gusta, igual
  // que cualquier otra foto).
  const handleGenerateImage = async () => {
    if (aiImagePrompt.trim().length < 5) {
      toast.error("Describe la imagen que quieres generar");
      return;
    }
    if (form.images.length >= MAX_PROPERTY_IMAGES) {
      toast.error(`Máximo ${MAX_PROPERTY_IMAGES} fotos por propiedad`);
      return;
    }
    setAiImageLoading(true);
    try {
      const res = await apiClient.post("/ai/listing-image", {
        prompt: aiImagePrompt.trim(),
      });
      setForm((f) => ({
        ...f,
        images: [...f.images, res.data.imageUrl],
      }));
      toast.success(
        res.data.mock
          ? "Imagen de muestra agregada (conecta MODEL_API_KEY para usar Muse Image real)"
          : "Imagen generada con Meta Muse Image"
      );
    } catch (e) {
      // apiClient already toasts the error
    } finally {
      setAiImageLoading(false);
    }
  };

  // SAM 3.1: revisa la primera foto en busca de personas, rostros o
  // placas visibles — informativo, no bloquea el envío a revisión.
  const handleScanPrivacy = async () => {
    const firstImage = imageSrc(form.images[0]);
    if (!firstImage) {
      toast.error("Agrega al menos una foto para revisarla");
      return;
    }
    setAiPrivacyLoading(true);
    setAiPrivacyResult(null);
    try {
      const res = await apiClient.post("/ai/privacy-scan", {
        imageUrl: firstImage,
      });
      setAiPrivacyResult(res.data);
      if (res.data.mock) {
        toast("Vista previa — conecta MODEL_API_KEY para analizar con SAM 3.1");
      } else if (res.data.hasSensitiveContent) {
        toast.error("SAM 3.1 detectó contenido sensible en la foto");
      } else {
        toast.success("SAM 3.1: sin contenido sensible visible");
      }
    } catch (e) {
      // apiClient already toasts the error
    } finally {
      setAiPrivacyLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("¿Eliminar esta propiedad?")) return;
    try {
      await apiClient.delete(`/properties/${id}`);
      toast.success("Propiedad eliminada");
      fetchProperties();
    } catch (e) {
      // apiClient already toasts the error message
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="font-bold text-lg">
          Mis propiedades ({activeCount}/{maxProperties})
        </h2>
        {!showForm && (
          <button
            className="btn btn-primary btn-sm"
            disabled={atLimit}
            onClick={() => setShowForm(true)}
          >
            {atLimit ? "Límite de tu plan alcanzado" : "+ Nueva propiedad"}
          </button>
        )}
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="glass-card rounded-2xl p-5 sm:p-6 space-y-4"
        >
          {/* Meta AI — Muse Spark redacta título + descripción a partir de
              notas crudas y los datos ya elegidos abajo (país/ciudad/precio).
              El resultado siempre queda editable antes de enviar. */}
          <div className="rounded-xl border border-secondary/30 bg-secondary/5 p-4 space-y-2">
            <p className="text-sm font-semibold flex items-center gap-2">
              Redactar con Meta AI
              <span className="badge badge-xs badge-secondary badge-outline">
                Muse Spark
              </span>
            </p>
            <textarea
              placeholder="Notas rápidas para la IA (ej. 3 recámaras, alberca, a 2 cuadras de la playa)"
              className="textarea textarea-bordered textarea-sm w-full"
              rows={2}
              value={aiNotes}
              onChange={(e) => setAiNotes(e.target.value)}
            />
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              disabled={aiCopyLoading}
              onClick={handleGenerateCopy}
            >
              {aiCopyLoading ? (
                <span className="loading loading-spinner loading-xs" />
              ) : (
                "Generar título y descripción"
              )}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              required
              type="text"
              placeholder="Título (ej. Villa frente al mar)"
              className="input input-bordered w-full"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
            <select
              required
              className="select select-bordered w-full"
              value={form.country}
              onChange={(e) => {
                const name = e.target.value;
                const match = countries.find((c) => c.name === name);
                setForm({ ...form, country: name, state: "", city: "" });
                setCountryCode(match?.code || "");
                setCityOptions([]);
              }}
            >
              <option value="" disabled>
                País
              </option>
              {countries.some((c) => c.priority) && (
                <optgroup label="Mercados principales">
                  {countries
                    .filter((c) => c.priority)
                    .map((c) => (
                      <option key={c.code} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                </optgroup>
              )}
              <optgroup label="Resto del mundo">
                {countries
                  .filter((c) => !c.priority)
                  .map((c) => (
                    <option key={c.code} value={c.name}>
                      {c.name}
                    </option>
                  ))}
              </optgroup>
            </select>

            {states.length > 0 && (
              <select
                required
                className="select select-bordered w-full"
                value={form.state}
                onChange={(e) => {
                  const name = e.target.value;
                  const match = states.find((s) => s.name === name);
                  setForm({ ...form, state: name, city: "" });
                  setStateCode(match?.code || "");
                }}
              >
                <option value="" disabled>
                  Estado/Provincia
                </option>
                {stateDropdownOptions.map((s) => (
                  <option key={s.code} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </select>
            )}

            <select
              required
              className="select select-bordered w-full disabled:opacity-50"
              disabled={!countryCode || (states.length > 0 && !stateCode)}
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
            >
              <option value="" disabled>
                {!countryCode
                  ? "Primero elige un país"
                  : states.length > 0 && !stateCode
                    ? "Primero elige un estado/provincia"
                    : loadingCities
                      ? "Cargando ciudades..."
                      : "Ciudad"}
              </option>
              {cityDropdownOptions.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
            <input
              required
              type="number"
              min="0"
              placeholder="Precio (USD)"
              className="input input-bordered w-full"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
            />
            <input
              type="email"
              placeholder="Email de contacto"
              className="input input-bordered w-full"
              value={form.contactEmail}
              onChange={(e) =>
                setForm({ ...form, contactEmail: e.target.value })
              }
            />
          </div>

          <textarea
            placeholder="Descripción"
            className="textarea textarea-bordered w-full"
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />

          <input
            type="text"
            placeholder="Zona o dirección (opcional, ej. Centro, frente al mar)"
            className="input input-bordered w-full"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
          />

          {/* Fotos: uploader propio a Vercel Blob (recomendado: genera
              variantes responsive) + opción de pegar una URL externa. La
              primera foto es la portada del listado. */}
          <div className="space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <p className="text-sm font-medium">
                Fotos ({form.images.length}/{MAX_PROPERTY_IMAGES})
              </p>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                disabled={uploading > 0}
                onClick={() => fileInputRef.current?.click()}
              >
                {uploading > 0 ? (
                  <>
                    <span className="loading loading-spinner loading-xs" />
                    Subiendo {uploading}...
                  </>
                ) : (
                  "+ Subir fotos"
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                multiple
                className="hidden"
                onChange={handleFiles}
              />
            </div>

            {form.images.length > 1 && (
              <p className="text-xs opacity-60">
                Arrastra para reordenar · haz clic en una foto para ponerla de
                portada
              </p>
            )}

            {form.images.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {form.images.map((img, i) => {
                  const src = normalizeImage(img)?.src;
                  if (!src) return null;
                  return (
                    <div
                      key={`${src}-${i}`}
                      className="relative group select-none"
                      draggable
                      onDragStart={(e) => {
                        dragIndexRef.current = i;
                        e.dataTransfer.effectAllowed = "move";
                        // Firefox exige setData para iniciar el arrastre.
                        e.dataTransfer.setData("text/plain", String(i));
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = "move";
                        if (dropTarget !== i) setDropTarget(i);
                      }}
                      onDragLeave={() => {
                        setDropTarget((t) => (t === i ? null : t));
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        const raw =
                          dragIndexRef.current ??
                          e.dataTransfer.getData("text/plain");
                        dragIndexRef.current = null;
                        setDropTarget(null);
                        const from =
                          typeof raw === "number"
                            ? raw
                            : Number.parseInt(raw, 10);
                        // parseInt("") es NaN: ignora arrastres ajenos (ej.
                        // soltar un archivo del sistema sobre una miniatura).
                        if (Number.isInteger(from)) moveImage(from, i);
                      }}
                      onDragEnd={() => {
                        dragIndexRef.current = null;
                        lastDragEndRef.current = Date.now();
                        setDropTarget(null);
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={src}
                        alt={`Foto ${i + 1}${i === 0 ? " (portada)" : ""}`}
                        title={
                          i === 0
                            ? "Portada actual"
                            : "Clic para poner de portada · arrastra para reordenar"
                        }
                        onClick={() => {
                          // Un arrastre soltado sobre la misma foto puede
                          // disparar clic al soltar: ignorar esos ~150ms.
                          if (Date.now() - lastDragEndRef.current < 150) return;
                          makeCover(i);
                        }}
                        className={`w-full aspect-[4/3] object-cover rounded-lg border border-base-content/10 cursor-pointer ${
                          dropTarget === i
                            ? "ring-2 ring-primary ring-offset-1"
                            : ""
                        }`}
                      />
                      {i === 0 && (
                        <span className="absolute top-1 left-1 badge badge-xs badge-primary">
                          Portada
                        </span>
                      )}
                      <button
                        type="button"
                        aria-label={`Quitar foto ${i + 1}`}
                        className="btn btn-xs btn-circle btn-error absolute top-1 right-1 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                        onClick={() => removeImage(i)}
                      >
                        ✕
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="url"
                placeholder="...o pega una URL de foto (https://...)"
                className="input input-bordered input-sm w-full"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addImageUrl();
                  }
                }}
              />
              <button
                type="button"
                className="btn btn-ghost btn-sm whitespace-nowrap"
                onClick={addImageUrl}
              >
                Agregar URL
              </button>
            </div>
          </div>

          {/* Meta AI — Muse Image genera una foto a partir de un prompt; SAM
              3.1 revisa la primera foto en busca de personas, rostros o placas
              visibles antes de publicar. Ambos son informativos: no bloquean
              el envío a revisión. */}
          <div className="rounded-xl border border-accent/30 bg-accent/5 p-4 space-y-3">
            <div className="space-y-2">
              <p className="text-sm font-semibold flex items-center gap-2">
                Generar imagen con Meta AI
                <span className="badge badge-xs badge-accent badge-outline">
                  Muse Image
                </span>
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  placeholder="Ej. villa frente al mar en Tulum, estilo moderno, atardecer"
                  className="input input-bordered input-sm w-full"
                  value={aiImagePrompt}
                  onChange={(e) => setAiImagePrompt(e.target.value)}
                />
                <button
                  type="button"
                  className="btn btn-accent btn-sm whitespace-nowrap"
                  disabled={aiImageLoading}
                  onClick={handleGenerateImage}
                >
                  {aiImageLoading ? (
                    <span className="loading loading-spinner loading-xs" />
                  ) : (
                    "Generar imagen"
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-2 pt-1 border-t border-accent/20">
              <p className="text-sm font-semibold flex items-center gap-2">
                Revisar privacidad de la primera foto
                <span className="badge badge-xs badge-accent badge-outline">
                  SAM 3.1
                </span>
              </p>
              <button
                type="button"
                className="btn btn-outline btn-accent btn-sm"
                disabled={aiPrivacyLoading}
                onClick={handleScanPrivacy}
              >
                {aiPrivacyLoading ? (
                  <span className="loading loading-spinner loading-xs" />
                ) : (
                  "Escanear imagen"
                )}
              </button>
              {aiPrivacyResult && (
                <p
                  className={`text-xs ${
                    aiPrivacyResult.mock
                      ? "opacity-60"
                      : aiPrivacyResult.hasSensitiveContent
                        ? "text-error"
                        : "text-success"
                  }`}
                >
                  {aiPrivacyResult.mock
                    ? aiPrivacyResult.note
                    : aiPrivacyResult.hasSensitiveContent
                      ? `Se detectó: ${aiPrivacyResult.findings
                          .map((f) => f.label)
                          .join(", ")}`
                      : "Sin contenido sensible visible"}
                </p>
              )}
            </div>
          </div>

          <div>
            <p className="text-sm font-medium mb-2">Criptomonedas que aceptas</p>
            <div className="flex flex-wrap gap-2">
              {CRYPTO_OPTIONS.map((symbol) => (
                <button
                  type="button"
                  key={symbol}
                  onClick={() => toggleCrypto(symbol)}
                  className={`badge badge-lg cursor-pointer ${
                    form.cryptoAccepted.includes(symbol)
                      ? "badge-primary"
                      : "badge-ghost border border-base-content/20"
                  }`}
                >
                  {symbol}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving || uploading > 0}
            >
              {saving ? (
                <span className="loading loading-spinner loading-xs" />
              ) : editingId ? (
                "Guardar cambios"
              ) : (
                "Enviar a revisión"
              )}
            </button>
            <button type="button" className="btn btn-ghost" onClick={resetForm}>
              Cancelar
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="opacity-60 text-sm">Cargando tus propiedades...</p>
      ) : properties.length === 0 ? (
        <p className="opacity-60 text-sm">
          Todavía no has publicado ninguna propiedad.
        </p>
      ) : (
        <ul className="space-y-3">
          {properties.map((property) => {
            const statusInfo =
              STATUS_LABEL[property.status] || STATUS_LABEL.pending;
            return (
              <li
                key={property.id}
                className="glass-card rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold">{property.title}</p>
                    <span className={`badge badge-sm ${statusInfo.className}`}>
                      {statusInfo.text}
                    </span>
                    {property.featured &&
                      property.featuredUntil &&
                      new Date(property.featuredUntil) > new Date() && (
                        <span className="badge badge-sm badge-warning">
                          Destacada hasta{" "}
                          {new Date(property.featuredUntil).toLocaleDateString()}
                        </span>
                      )}
                  </div>
                  <p className="text-sm opacity-60">
                    {property.city}
                    {property.state ? `, ${property.state}` : ""}
                    {property.country ? `, ${property.country}` : ""} · $
                    {property.price?.toLocaleString()} {property.currency}
                  </p>
                  {property.status === "rejected" && property.rejectionReason && (
                    <p className="text-xs text-error mt-1">
                      Motivo: {property.rejectionReason}
                    </p>
                  )}
                </div>
                <div className="flex gap-2 flex-wrap">
                  {property.status === "published" && (
                    <button
                      className="btn btn-warning btn-xs"
                      disabled={featuring === property.id}
                      onClick={() => handleFeature(property.id)}
                    >
                      {featuring === property.id
                        ? "Redirigiendo..."
                        : `Destacar ($${featuredListing?.price ?? 149})`}
                    </button>
                  )}
                  <button
                    className="btn btn-ghost btn-xs"
                    onClick={() => startEdit(property)}
                  >
                    Editar
                  </button>
                  <button
                    className="btn btn-ghost btn-xs text-error"
                    onClick={() => handleDelete(property.id)}
                  >
                    Eliminar
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default PropertyManager;

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/sidebar-admin";
import Topbar from "../../components/topbar-admin";
import styles from "./news.module.css";
import {
  Plus,
  Eye,
  EyeOff,
  Search,
  Newspaper,
  Save,
  X,
  AlertCircle,
  Loader2,
} from "lucide-react";
import {
  newsService,
  type ServiceNewsDetailDto,
  type CreateServiceNewsDto,
  type UpdateServiceNewsDto,
} from "../../services/newsService";

const GestioneNews: React.FC = () => {
  const [menuState, setMenuState] = useState<"open" | "closed">("open");
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingNews, setEditingNews] = useState<ServiceNewsDetailDto | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Loading and error states
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    isVisible: true,
  });

  // News data from API
  const [newsData, setNewsData] = useState<ServiceNewsDetailDto[]>([]);

  const toggleMenu = () => {
    setMenuState(menuState === "open" ? "closed" : "open");
  };

  // Load news on component mount
  useEffect(() => {
    loadNews();
  }, []);

  const loadNews = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const multitenantId = newsService.getMultitenantId();
      const data = await newsService.getAllNews(multitenantId || undefined);
      setNewsData(data);
    } catch (err) {
      console.error("Error loading news:", err);
      setError("Errore nel caricamento delle news");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredNews = newsData.filter(
    (news) =>
      news.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      news.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddNew = () => {
    setEditingNews(null);
    setFormData({ title: "", content: "", isVisible: true });
    setShowForm(true);
  };

  const handleEdit = (news: ServiceNewsDetailDto) => {
    setEditingNews(news);
    setFormData({
      title: news.title,
      content: news.content,
      isVisible: news.isVisible,
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      alert("Compila tutti i campi obbligatori");
      return;
    }

    setIsSaving(true);
    try {
      const multitenantId = newsService.getMultitenantId();
      const userName = sessionStorage.getItem("userName") || sessionStorage.getItem("username");

      if (editingNews) {
        // Update existing news
        const updateData: UpdateServiceNewsDto = {
          title: formData.title,
          content: formData.content,
          isVisible: formData.isVisible,
          updatedBy: userName || undefined,
        };
        await newsService.updateNews(editingNews.newsId, updateData);
      } else {
        // Create new news
        const createData: CreateServiceNewsDto = {
          title: formData.title,
          content: formData.content,
          isVisible: formData.isVisible,
          companyId: multitenantId,
          multitenantId: multitenantId,
          createdBy: userName || undefined,
        };
        await newsService.createNews(createData);
      }

      setShowForm(false);
      setEditingNews(null);
      setFormData({ title: "", content: "", isVisible: true });
      await loadNews();
    } catch (err) {
      console.error("Error saving news:", err);
      alert("Errore nel salvataggio della news");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (newsId: string) => {
    try {
      await newsService.deleteNews(newsId);
      setDeleteConfirm(null);
      await loadNews();
    } catch (err) {
      console.error("Error deleting news:", err);
      alert("Errore nell'eliminazione della news");
    }
  };

  const toggleVisibility = async (newsId: string) => {
    try {
      const userName = sessionStorage.getItem("userName") || sessionStorage.getItem("username");
      await newsService.toggleVisibility(newsId, userName || undefined);
      await loadNews();
    } catch (err) {
      console.error("Error toggling visibility:", err);
      alert("Errore nel cambio visibilità");
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingNews(null);
    setFormData({ title: "", content: "", isVisible: true });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("it-IT", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="main-layout">
      <Sidebar menuState={menuState} toggleMenu={toggleMenu} />
      <div className="content-area">
        <Topbar toggleMenu={toggleMenu} />

        <div className={styles.pageHeader}>
          <div className={styles.headerLeft}>
            <h1 className={styles.pageTitle}>Gestione News Rete</h1>
            <div className={styles.breadcrumb}>
              <span className={styles.breadcrumbItem}>Home</span>
              <span className={styles.breadcrumbSeparator}>/</span>
              <span className={styles.breadcrumbItem}>Area Riservata</span>
              <span className={styles.breadcrumbSeparator}>/</span>
              <span className={styles.breadcrumbCurrent}>Gestione News</span>
            </div>
          </div>
          <button
            type="button"
            className={styles.backButton}
            onClick={() => navigate("/dashboard-admin")}
          >
            Torna alla Dashboard
          </button>
        </div>

        <div className="page-body">
          <div className={styles.newsCard}>
            <div className={styles.cardHeader}>
              <Newspaper size={24} color="#fff" />
              <h2 className={styles.cardTitle}>Service News</h2>
            </div>

            <div className={styles.toolbar}>
              <div className={styles.searchBox}>
                <Search size={18} className={styles.searchIcon} />
                <input
                  type="text"
                  placeholder="Cerca news..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={styles.searchInput}
                />
              </div>
              <button type="button" className={styles.addButton} onClick={handleAddNew}>
                <Plus size={18} />
                Nuova News
              </button>
            </div>

            {showForm && (
              <div className={styles.formContainer}>
                <div className={styles.formHeader}>
                  <h3 className={styles.formTitle}>
                    {editingNews ? "Modifica News" : "Nuova News"}
                  </h3>
                  <button type="button" className={styles.closeFormBtn} onClick={handleCancel}>
                    <X size={20} />
                  </button>
                </div>
                <div className={styles.formBody}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Titolo *</label>
                    <input
                      type="text"
                      className={styles.formInput}
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Inserisci il titolo della news"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Contenuto *</label>
                    <textarea
                      className={styles.formTextarea}
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      placeholder="Inserisci il contenuto della news"
                      rows={5}
                    />
                  </div>
                  <div className={styles.formGroupInline}>
                    <label className={styles.formLabel}>Visibile in Dashboard</label>
                    <label className={styles.switch}>
                      <input
                        type="checkbox"
                        checked={formData.isVisible}
                        onChange={(e) => setFormData({ ...formData, isVisible: e.target.checked })}
                      />
                      <span className={styles.slider}></span>
                    </label>
                  </div>
                </div>
                <div className={styles.formFooter}>
                  <button type="button" className={styles.cancelBtn} onClick={handleCancel}>
                    Annulla
                  </button>
                  <button
                    type="button"
                    className={styles.saveBtn}
                    onClick={handleSave}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 size={16} className={styles.spinIcon} />
                        Salvataggio...
                      </>
                    ) : (
                      <>
                        <Save size={16} />
                        {editingNews ? "Salva Modifiche" : "Crea News"}
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {error && (
              <div className={styles.errorMessage}>
                <AlertCircle size={20} />
                <span>{error}</span>
                <button type="button" onClick={loadNews} className={styles.retryBtn}>
                  Riprova
                </button>
              </div>
            )}

            <div className={styles.tableContainer}>
              {isLoading ? (
                <div className={styles.loadingContainer}>
                  <Loader2 size={32} className={styles.spinIcon} />
                  <span>Caricamento news...</span>
                </div>
              ) : (
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Titolo</th>
                      <th>Data</th>
                      <th>Visibilità</th>
                      <th>Azioni</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredNews.length === 0 ? (
                      <tr>
                        <td colSpan={4} className={styles.emptyRow}>
                          <AlertCircle size={24} />
                          <span>Nessuna news trovata</span>
                        </td>
                      </tr>
                    ) : (
                      filteredNews.map((news) => (
                        <tr key={news.newsId}>
                          <td>
                            <div className={styles.newsTitle}>{news.title}</div>
                            <div className={styles.newsPreview}>
                              {news.content.substring(0, 100)}...
                            </div>
                          </td>
                          <td className={styles.dateCell}>
                            {formatDate(news.publishDate)}
                          </td>
                          <td>
                            <button
                              type="button"
                              className={`${styles.visibilityBtn} ${
                                news.isVisible ? styles.visible : styles.hidden
                              }`}
                              onClick={() => toggleVisibility(news.newsId)}
                            >
                              {news.isVisible ? (
                                <>
                                  <Eye size={16} />
                                  Visibile
                                </>
                              ) : (
                                <>
                                  <EyeOff size={16} />
                                  Nascosta
                                </>
                              )}
                            </button>
                          </td>
                          <td>
                            <div className={styles.actions}>
                              <button
                                type="button"
                                className={styles.editBtn}
                                onClick={() => handleEdit(news)}
                                title="Modifica"
                              >
                                <i className="fa-solid fa-pen-to-square" aria-hidden="true"></i>
                              </button>
                              {deleteConfirm === news.newsId ? (
                                <div className={styles.deleteConfirm}>
                                  <button
                                    type="button"
                                    className={styles.confirmYes}
                                    onClick={() => handleDelete(news.newsId)}
                                  >
                                    Si
                                  </button>
                                  <button
                                    type="button"
                                    className={styles.confirmNo}
                                    onClick={() => setDeleteConfirm(null)}
                                  >
                                    No
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  className={styles.deleteBtn}
                                  onClick={() => setDeleteConfirm(news.newsId)}
                                  title="Elimina"
                                >
                                  <i className="fa-solid fa-trash" aria-hidden="true"></i>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GestioneNews;

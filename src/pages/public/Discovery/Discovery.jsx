import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { fetchCategories, fetchPublicResources, fetchTags } from "../../../services/resourceService";
import "./Discovery.css";

const DEFAULT_FILTERS = {
  keyword: "",
  categoryId: "",
  place: "",
  tag: "",
  sortBy: "updatedTime",
  sortDir: "desc",
  size: "10",
};

const SORT_BY_OPTIONS = [
  { value: "updatedTime", label: "Updated Time" },
  { value: "createTime", label: "Created Time" },
];

const SORT_DIRECTION_OPTIONS = [
  { value: "desc", label: "DESC" },
  { value: "asc", label: "ASC" },
];

const PAGE_SIZE_OPTIONS = ["10", "20", "30", "50"];

const EMPTY_PAGE = {
  content: [],
  page: 0,
  size: 10,
  totalElements: 0,
  totalPages: 0,
  hasNext: false,
  hasPrevious: false,
};

function Discovery() {
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [formFilters, setFormFilters] = useState(DEFAULT_FILTERS);
  const [activeFilters, setActiveFilters] = useState(DEFAULT_FILTERS);
  const [pageData, setPageData] = useState(EMPTY_PAGE);
  const [page, setPage] = useState(0);
  const [isLoadingFilters, setIsLoadingFilters] = useState(true);
  const [isLoadingResources, setIsLoadingResources] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isUnmounted = false;

    async function loadFilterOptions() {
      setIsLoadingFilters(true);

      try {
        const [categoryList, tagList] = await Promise.all([fetchCategories(), fetchTags()]);
        if (isUnmounted) return;

        setCategories(Array.isArray(categoryList) ? categoryList : []);
        setTags(Array.isArray(tagList) ? tagList : []);
      } catch (error) {
        if (isUnmounted) return;
        setErrorMessage(error.message || "Failed to load categories and tags.");
      } finally {
        if (!isUnmounted) {
          setIsLoadingFilters(false);
        }
      }
    }

    loadFilterOptions();

    return () => {
      isUnmounted = true;
    };
  }, []);

  useEffect(() => {
    let isUnmounted = false;

    async function loadResources() {
      setIsLoadingResources(true);
      setErrorMessage("");

      try {
        const data = await fetchPublicResources({
          ...activeFilters,
          page,
          size: Number(activeFilters.size) || 10,
        });

        if (isUnmounted) return;
        const normalized = normalizePageResult(data, page);
        setPageData(normalized);

        if (normalized.totalPages > 0 && page >= normalized.totalPages) {
          setPage(normalized.totalPages - 1);
        }
      } catch (error) {
        if (isUnmounted) return;
        setPageData(EMPTY_PAGE);
        setErrorMessage(error.message || "Failed to load resources.");
      } finally {
        if (!isUnmounted) {
          setIsLoadingResources(false);
        }
      }
    }

    loadResources();

    return () => {
      isUnmounted = true;
    };
  }, [activeFilters, page]);

  const pageLabel = pageData.totalPages === 0 ? 0 : pageData.page + 1;
  const statusText = useMemo(() => {
    if (isLoadingResources) return "Loading resources...";
    return `Page ${pageLabel} / ${pageData.totalPages} · ${pageData.totalElements} items`;
  }, [isLoadingResources, pageData.totalElements, pageData.totalPages, pageLabel]);

  const isPrevDisabled = isLoadingResources || page <= 0;
  const isNextDisabled = isLoadingResources || pageData.totalPages === 0 || page + 1 >= pageData.totalPages;

  const onInputChange = (event) => {
    const { name, value } = event.target;
    setFormFilters((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const onSearch = (event) => {
    event.preventDefault();
    setActiveFilters(formFilters);
    setPage(0);
  };

  const onReset = () => {
    setFormFilters(DEFAULT_FILTERS);
    setActiveFilters(DEFAULT_FILTERS);
    setPage(0);
  };

  const goPrevPage = () => {
    if (isPrevDisabled) return;
    setPage((previous) => Math.max(previous - 1, 0));
  };

  const goNextPage = () => {
    if (isNextDisabled) return;
    setPage((previous) => previous + 1);
  };

  return (
    <section className="discovery-page">
      <div className="discovery-page__ornament" aria-hidden="true" />
      <div className="discovery-page__container">
        <header className="discovery-hero">
          <p className="discovery-hero__eyebrow">Public Browse</p>
          <h1 className="discovery-hero__title">Resource Discovery</h1>
          <p className="discovery-hero__description">
            Explore the public heritage plaza with keyword search, category and tag filtering, plus pageable results.
          </p>
        </header>

        <form className="discovery-filter" onSubmit={onSearch}>
          <div className="discovery-filter__grid">
            <label className="discovery-field">
              <span className="discovery-field__label">Keyword</span>
              <input
                className="discovery-field__control"
                name="keyword"
                type="text"
                value={formFilters.keyword}
                onChange={onInputChange}
                placeholder="Search title / description"
              />
              <span className="discovery-field__hint">Matched against title and description.</span>
            </label>

            <label className="discovery-field">
              <span className="discovery-field__label">Category</span>
              <select
                className="discovery-field__control"
                name="categoryId"
                value={formFilters.categoryId}
                onChange={onInputChange}
                disabled={isLoadingFilters}
              >
                <option value="">Any</option>
                {categories.map((category) => (
                  <option key={category.categoryId} value={category.categoryId}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="discovery-field">
              <span className="discovery-field__label">Place</span>
              <input
                className="discovery-field__control"
                name="place"
                type="text"
                value={formFilters.place}
                onChange={onInputChange}
                placeholder="e.g. Xi'an, Museum, Archive"
              />
            </label>

            <label className="discovery-field">
              <span className="discovery-field__label">Tag</span>
              <select
                className="discovery-field__control"
                name="tag"
                value={formFilters.tag}
                onChange={onInputChange}
                disabled={isLoadingFilters}
              >
                <option value="">Any</option>
                {tags.map((tag) => (
                  <option key={tag.tagId || tag.name} value={tag.name}>
                    {tag.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="discovery-field">
              <span className="discovery-field__label">Sort By</span>
              <select
                className="discovery-field__control"
                name="sortBy"
                value={formFilters.sortBy}
                onChange={onInputChange}
              >
                {SORT_BY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="discovery-field">
              <span className="discovery-field__label">Sort Direction</span>
              <select
                className="discovery-field__control"
                name="sortDir"
                value={formFilters.sortDir}
                onChange={onInputChange}
              >
                {SORT_DIRECTION_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="discovery-field">
              <span className="discovery-field__label">Page Size</span>
              <select className="discovery-field__control" name="size" value={formFilters.size} onChange={onInputChange}>
                {PAGE_SIZE_OPTIONS.map((pageSize) => (
                  <option key={pageSize} value={pageSize}>
                    {pageSize}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="discovery-filter__actions">
            <div className="discovery-filter__buttons">
              <button className="discovery-btn discovery-btn--primary" type="submit" disabled={isLoadingResources}>
                Search
              </button>
              <button className="discovery-btn discovery-btn--ghost" type="button" onClick={onReset} disabled={isLoadingResources}>
                Reset
              </button>
            </div>
            <p className="discovery-filter__status">{statusText}</p>
          </div>
        </form>

        {errorMessage && <div className="discovery-alert">{errorMessage}</div>}

        <section className="discovery-results" aria-live="polite" aria-busy={isLoadingResources}>
          {isLoadingResources && <div className="discovery-state">Loading public resources...</div>}

          {!isLoadingResources && pageData.content.length === 0 && (
            <div className="discovery-state">No approved resources found.</div>
          )}

          {!isLoadingResources && pageData.content.length > 0 && (
            <div className="discovery-grid">
              {pageData.content.map((resource) => {
                const tagList = getTagList(resource.tags);

                return (
                  <article className="discovery-card" key={resource.resourceId}>
                    <div className="discovery-card__meta">
                      <span className="discovery-chip discovery-chip--status">{resource.status || "APPROVED"}</span>
                      <span className="discovery-chip">{resource.categoryName || "Uncategorized"}</span>
                      <span className="discovery-chip">{resource.placeName || "Unknown place"}</span>
                    </div>

                    <h2 className="discovery-card__title">{resource.title}</h2>
                    <p className="discovery-card__topic">{resource.topic || "No summary provided."}</p>

                    <p className="discovery-card__contributor">By {resource.contributorName || "Unknown contributor"}</p>

                    <div className="discovery-card__tags">
                      {tagList.map((tag) => (
                        <span key={`${resource.resourceId}-${tag}`} className="discovery-chip discovery-chip--tag">
                          #{tag}
                        </span>
                      ))}
                      {tagList.length === 0 && <span className="discovery-chip discovery-chip--muted">No tags</span>}
                    </div>

                    <div className="discovery-card__footer">
                      <span>Updated {formatDateTime(resource.updatedAt)}</span>
                      <Link className="discovery-card__link" to={`/resource/${resource.resourceId}`}>
                        View Detail
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <footer className="discovery-pagination">
          <button className="discovery-btn discovery-btn--ghost" type="button" onClick={goPrevPage} disabled={isPrevDisabled}>
            Prev
          </button>
          <p className="discovery-pagination__info">
            Page {pageLabel} / {pageData.totalPages} · {pageData.totalElements} items
          </p>
          <button className="discovery-btn discovery-btn--ghost" type="button" onClick={goNextPage} disabled={isNextDisabled}>
            Next
          </button>
        </footer>
      </div>
    </section>
  );
}

function normalizePageResult(raw, fallbackPage) {
  if (Array.isArray(raw)) {
    return {
      content: raw,
      page: fallbackPage,
      size: raw.length,
      totalElements: raw.length,
      totalPages: raw.length > 0 ? 1 : 0,
      hasNext: false,
      hasPrevious: false,
    };
  }

  return {
    content: Array.isArray(raw?.content) ? raw.content : [],
    page: Number.isInteger(raw?.page) ? raw.page : fallbackPage,
    size: Number.isInteger(raw?.size) ? raw.size : 10,
    totalElements: Number.isFinite(raw?.totalElements) ? raw.totalElements : 0,
    totalPages: Number.isInteger(raw?.totalPages) ? raw.totalPages : 0,
    hasNext: Boolean(raw?.hasNext),
    hasPrevious: Boolean(raw?.hasPrevious),
  };
}

function getTagList(tags) {
  if (!Array.isArray(tags)) return [];
  return tags.filter(Boolean);
}

function formatDateTime(value) {
  if (!value) return "N/A";
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

export default Discovery;

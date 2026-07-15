// ═══════════════════════════════════════════════════════════════
// Product Details Page
// Interactive variant selectors, image galleries, spec tabs, and Q&As
// ═══════════════════════════════════════════════════════════════

'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button/Button';
import { Card } from '@/components/ui/Card/Card';
import { Input } from '@/components/ui/Input/Input';
import { Badge } from '@/components/ui/Badge/Badge';
import { Alert } from '@/components/ui/Alert/Alert';
import { Spinner } from '@/components/ui/Spinner/Spinner';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs/Breadcrumbs';
import { Tabs } from '@/components/ui/Tabs/Tabs';
import { useCartStore } from '@/stores/cart.store';
import { useAuthStore } from '@/stores/auth.store';
import styles from './product-detail.module.css';

export default function ProductDetailPage() {
  const { slug } = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { addToCart } = useCartStore();
  const { isAuthenticated } = useAuthStore();

  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [newQuestion, setNewQuestion] = useState('');
  const [questionError, setQuestionError] = useState<string | null>(null);
  const [questionSuccess, setQuestionSuccess] = useState<string | null>(null);

  // Fetch product detail
  const { data: response, isLoading, error } = useQuery({
    queryKey: ['product-detail', slug],
    queryFn: () => api.get<any>(`/products/slug/${slug}`),
    enabled: !!slug,
  });

  const product = response?.data;

  // Set default variant once loaded
  useEffect(() => {
    if (product?.variants?.length > 0) {
      const defaultVar = product.variants.find((v: any) => v.isDefault && v.isActive) || product.variants[0];
      if (defaultVar) {
        setSelectedVariantId(defaultVar.id);
      }
    }
  }, [product]);

  // Submit Q&A mutation
  const askQuestionMutation = useMutation({
    mutationFn: (text: string) =>
      api.post(`/reviews/products/${product.id}/questions`, { question: text }),
    onSuccess: () => {
      setNewQuestion('');
      setQuestionSuccess('Your question was submitted successfully. An administrator will review and answer it shortly.');
      queryClient.invalidateQueries({ queryKey: ['product-questions', product.id] });
    },
    onError: (err: any) => {
      setQuestionError(err.message || 'Failed to submit question. Please try again.');
    },
  });

  if (isLoading) {
    return (
      <div className={styles.centerWrapper}>
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className={`${styles.centerWrapper} container`}>
        <Alert variant="error" title="Product Not Found">
          The requested product could not be found or has been archived.
        </Alert>
      </div>
    );
  }

  // Find active variant details
  const activeVariant = product.variants?.find((v: any) => v.id === selectedVariantId) || product.variants?.[0];
  const price = activeVariant ? Number(activeVariant.price) : Number(product.salePrice || product.basePrice);
  const compareAtPrice = activeVariant ? Number(activeVariant.compareAtPrice) : Number(product.basePrice);
  const sku = activeVariant ? activeVariant.sku : product.sku;
  const stock = activeVariant ? activeVariant.stock : 0;

  const images = product.images?.length > 0 ? product.images : [{ url: 'https://placehold.co/600x600/e5e7eb/111827?text=Product' }];

  const handleAddToCart = () => {
    if (product && activeVariant) {
      addToCart(product.id, activeVariant.id, quantity);
    }
  };

  const handleAskQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    setQuestionError(null);
    setQuestionSuccess(null);

    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (newQuestion.trim().length < 10) {
      setQuestionError('Question must be at least 10 characters long');
      return;
    }

    askQuestionMutation.mutate(newQuestion.trim());
  };

  // Tabs setup
  const tabItems = [
    {
      id: 'description',
      label: 'Description',
      content: <p className={styles.descriptionText}>{product.description}</p>,
    },
    {
      id: 'specifications',
      label: 'Specifications',
      content:
        product.specifications?.length > 0 ? (
          <table className={styles.specTable}>
            <tbody>
              {product.specifications.map((spec: any) => (
                <tr key={spec.id} className={styles.specRow}>
                  <td className={styles.specKey}>{spec.key}</td>
                  <td className={styles.specVal}>{spec.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className={styles.descriptionText}>No specifications listed for this product.</p>
        ),
    },
  ];

  return (
    <div className={`${styles.pageContainer} container`}>
      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'Products', href: '/products' },
          { label: product.name },
        ]}
      />

      <div className={styles.productLayout}>
        {/* ─── Left Column: Image Gallery ───────────────────────── */}
        <div className={styles.gallery}>
          <div className={styles.mainImageWrapper}>
            <img src={images[activeImageIndex]?.url} alt={product.name} className={styles.mainImage} />
          </div>
          {images.length > 1 && (
            <div className={styles.thumbnails}>
              {images.map((img: any, idx: number) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`${styles.thumbnailButton} ${activeImageIndex === idx ? styles.activeThumbnail : ''}`}
                >
                  <img src={img.url} alt={`Thumbnail ${idx + 1}`} className={styles.thumbnailImage} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ─── Right Column: Information ───────────────────────── */}
        <div className={styles.details}>
          <span className={styles.brandName}>{product.brand?.name || 'Generic'}</span>
          <h1 className={styles.productTitle}>{product.name}</h1>

          <div className={styles.ratingSummary}>
            <span className={styles.stars}>★</span>
            <span className={styles.ratingAvg}>{Number(product.avgRating).toFixed(1)}</span>
            <span className={styles.reviewsCount}>({product.totalReviews} customer reviews)</span>
          </div>

          <div className={styles.priceContainer}>
            <span className={styles.price}>${price.toFixed(2)}</span>
            {compareAtPrice > price && (
              <span className={styles.comparePrice}>${compareAtPrice.toFixed(2)}</span>
            )}
          </div>

          <p className={styles.shortDescription}>{product.shortDescription || 'No short description provided.'}</p>

          <div className={styles.metadata}>
            <div>
              <strong>SKU:</strong> {sku}
            </div>
            <div>
              <strong>Category:</strong> {product.category?.name}
            </div>
            <div>
              <strong>Availability:</strong>{' '}
              {stock > 0 ? (
                <Badge variant="success">In Stock ({stock})</Badge>
              ) : (
                <Badge variant="error">Out of Stock</Badge>
              )}
            </div>
          </div>

          {/* Variants Selectors */}
          {product.variants?.length > 1 && (
            <div className={styles.variants}>
              <h3 className={styles.variantsTitle}>Select Variant</h3>
              <div className={styles.variantsGrid}>
                {product.variants.map((variant: any) => (
                  <button
                    key={variant.id}
                    onClick={() => setSelectedVariantId(variant.id)}
                    className={`${styles.variantOption} ${selectedVariantId === variant.id ? styles.activeVariant : ''} ${!variant.isActive ? styles.disabledVariant : ''}`}
                    disabled={!variant.isActive}
                  >
                    <div>{variant.name}</div>
                    <div className={styles.variantPrice}>${Number(variant.price).toFixed(2)}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Add to Cart Actions */}
          {stock > 0 && (
            <div className={styles.actions}>
              <div className={styles.quantityWrapper}>
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className={styles.qtyBtn}
                >
                  -
                </button>
                <input
                  type="number"
                  className={styles.qtyInput}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.min(stock, Math.max(1, Number(e.target.value) || 1)))}
                  min={1}
                  max={stock}
                />
                <button
                  onClick={() => setQuantity((q) => Math.min(stock, q + 1))}
                  className={styles.qtyBtn}
                >
                  +
                </button>
              </div>
              <Button variant="primary" onClick={handleAddToCart} className={styles.cartButton}>
                Add to Cart
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* ─── Bottom Tabs: Description & Specs ─────────────────── */}
      <section className={styles.tabsSection}>
        <Tabs tabs={tabItems} />
      </section>

      {/* ─── Customer Reviews Section ─────────────────────────── */}
      <section className={styles.bottomSection}>
        <h2 className={styles.sectionHeading}>Customer Reviews</h2>
        {product.reviews?.length > 0 ? (
          <div className={styles.reviewsGrid}>
            {product.reviews.map((review: any) => (
              <Card key={review.id} padding="md" className={styles.reviewCard}>
                <div className={styles.reviewHeader}>
                  <div className={styles.reviewUser}>
                    <strong className={styles.reviewerName}>
                      {review.user?.firstName} {review.user?.lastName}
                    </strong>
                    {review.isVerifiedPurchase && (
                      <Badge variant="success" size="sm">
                        Verified Purchase
                      </Badge>
                    )}
                  </div>
                  <span className={styles.reviewDate}>
                    {new Date(review.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className={styles.reviewStars}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i} className={i < review.rating ? styles.starFilled : styles.starEmpty}>
                      ★
                    </span>
                  ))}
                </div>
                {review.title && <h4 className={styles.reviewTitle}>{review.title}</h4>}
                <p className={styles.reviewComment}>{review.comment}</p>
              </Card>
            ))}
          </div>
        ) : (
          <p className={styles.emptyMsg}>No reviews submitted yet for this product.</p>
        )}
      </section>

      {/* ─── Product Q&A Section ─────────────────────────────── */}
      <section className={styles.bottomSection}>
        <h2 className={styles.sectionHeading}>Questions & Answers</h2>

        {/* Ask Question Form */}
        <Card padding="md" className={styles.questionFormCard}>
          <h3 className={styles.askTitle}>Have a question?</h3>
          {questionError && <Alert variant="error">{questionError}</Alert>}
          {questionSuccess && <Alert variant="success">{questionSuccess}</Alert>}
          <form onSubmit={handleAskQuestion} className={styles.questionForm}>
            <div className={styles.questionInputWrapper}>
              <Input
                id="questionText"
                placeholder="Ask about details, sizing, specs..."
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                disabled={askQuestionMutation.isPending}
              />
            </div>
            <Button type="submit" variant="primary" loading={askQuestionMutation.isPending}>
              Submit Question
            </Button>
          </form>
        </Card>

        {/* Questions list */}
        {product.questionsAnswers?.length > 0 ? (
          <div className={styles.qnaList}>
            {product.questionsAnswers.map((qa: any) => (
              <div key={qa.id} className={styles.qnaItem}>
                <div className={styles.questionRow}>
                  <span className={styles.qBadge}>Q</span>
                  <div className={styles.qContent}>
                    <strong>{qa.question}</strong>
                    <span className={styles.qDate}>
                      Asked on {new Date(qa.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                {qa.answer && (
                  <div className={styles.answerRow}>
                    <span className={styles.aBadge}>A</span>
                    <div className={styles.aContent}>
                      <p>{qa.answer}</p>
                      <span className={styles.aAuthor}>Answered by Staff</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className={styles.emptyMsg}>No questions asked yet about this product.</p>
        )}
      </section>
    </div>
  );
}

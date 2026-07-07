import { DocumentPreview } from '../components/documents/DocumentPreview';

/**
 * Document preview page wrapper that renders the DocumentPreview component
 * with documentId from URL params. Includes DocumentFulfillment for
 * download/email actions from the preview view.
 *
 * Implements:
 *   - SCRUM-256: Preview Document
 */
export function PreviewPage() {
  return <DocumentPreview />;
}

export default PreviewPage;
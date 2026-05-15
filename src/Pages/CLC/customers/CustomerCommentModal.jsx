import Modal from '../../../components/UI/modal.jsx';
import Button from '../../../components/UI/button.jsx';

export default function CustomerCommentModal({
  commentCustomer,
  commentText,
  setCommentText,
  onSubmit,
  onClose,
  isSaving,
}) {
  return (
    <Modal
      isOpen={Boolean(commentCustomer)}
      onClose={onClose}
      title={commentCustomer ? `Add Comment for ${commentCustomer.name || 'Customer'}` : 'Add Comment'}
    >
      <form className="space-y-4" onSubmit={onSubmit}>
        <div>
          <label
            htmlFor="customer-comment"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Comment
          </label>

          <textarea
            id="customer-comment"
            rows={4}
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Add a note about this customer..."
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div className="flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSaving}
          >
            Cancel
          </Button>

          <Button type="submit" isLoading={isSaving}>
            Save Comment
          </Button>
        </div>
      </form>
    </Modal>
  );
}

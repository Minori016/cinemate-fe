import { useState, useEffect, useCallback } from 'react'
import { contactService } from '../../../services/contactService'
import Button from '../../../components/common/Button'
import { motion, AnimatePresence } from 'motion/react'
import {
  MessageSquare, Search,
  X, CheckCircle, Clock, Eye, Send
} from 'lucide-react'

export default function ContactManagementPage() {
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  
  // View/Reply Modal
  const [showReplyModal, setShowReplyModal] = useState(false)
  const [selectedContact, setSelectedContact] = useState(null)
  const [replyMessage, setReplyMessage] = useState('')
  const [replying, setReplying] = useState(false)

  const load = useCallback((pageNum = 0) => {
    setLoading(true)
    contactService.getAllContacts(pageNum + 1, 10)
      .then(r => {
        const resData = r?.result ?? r ?? {}
        const list = resData.content ?? resData.data ?? []
        setContacts(list)
        setTotalPages(resData.totalPages ?? 0)
        setTotalElements(resData.totalElements ?? list.length)
        setPage(pageNum)
      })
      .catch(e => console.error(e))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load(0)
  }, [load])

  const handleReply = async () => {
    if (!replyMessage.trim()) return
    setReplying(true)
    try {
      await contactService.replyToContact(selectedContact.id, replyMessage)
      setShowReplyModal(false)
      load(page)
    } catch (e) {
      console.error(e)
      alert('Có lỗi khi gửi phản hồi.')
    } finally {
      setReplying(false)
    }
  }

  // Helper: check if a contact is flagged by AI
  // Backend returns "blurred" (Lombok boolean isBlurred -> Jackson serializes as "blurred")
  const isFlagged = (contact) => contact?.blurred === true

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
        return <span className="px-3 py-1 bg-yellow-50 text-yellow-600 rounded-full text-xs font-semibold border border-yellow-200 flex items-center gap-1 w-fit"><Clock className="w-3 h-3" /> Chờ phản hồi</span>
      case 'REPLIED':
        return <span className="px-3 py-1 bg-green-50 text-green-600 rounded-full text-xs font-semibold border border-green-200 flex items-center gap-1 w-fit"><CheckCircle className="w-3 h-3" /> Đã phản hồi</span>
      default:
        return <span className="px-3 py-1 bg-gray-50 text-gray-600 rounded-full text-xs font-semibold border border-gray-200 w-fit">{status}</span>
    }
  }

  return (
    <motion.div
      className="space-y-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
    >
      <motion.div
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div>
          <h1
            className="text-2xl sm:text-3xl lg:text-4xl text-gray-900 font-bold tracking-wider uppercase flex items-center gap-3"
            style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 900 }}
          >
            <MessageSquare className="w-8 h-8 text-red-500" />
            Phản hồi tin nhắn
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>
            Quản lý và trả lời tin nhắn từ người dùng
          </p>
        </div>
      </motion.div>

      <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-gray-50/50">
                <th className="p-4 text-sm font-semibold text-gray-500 uppercase tracking-wider">ID</th>
                <th className="p-4 text-sm font-semibold text-gray-500 uppercase tracking-wider">Người gửi</th>
                <th className="p-4 text-sm font-semibold text-gray-500 uppercase tracking-wider">Chủ đề</th>
                <th className="p-4 text-sm font-semibold text-gray-500 uppercase tracking-wider">Trạng thái AI</th>
                <th className="p-4 text-sm font-semibold text-gray-500 uppercase tracking-wider">Trạng thái xử lý</th>
                <th className="p-4 text-sm font-semibold text-gray-500 uppercase tracking-wider">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-gray-500">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                      Đang tải dữ liệu...
                    </div>
                  </td>
                </tr>
              ) : contacts.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-gray-500">
                    Chưa có tin nhắn liên hệ nào.
                  </td>
                </tr>
              ) : (
                contacts.map(contact => (
                  <tr key={contact.id} className="border-b border-[var(--color-border)] hover:bg-gray-50 transition-colors">
                    <td className="p-4 text-gray-600 font-medium">#{contact.id}</td>
                    <td className="p-4">
                      <div className="font-semibold text-gray-900">{contact.name}</div>
                      <div className="text-sm text-gray-500">{contact.email}</div>
                    </td>
                    <td className="p-4 text-gray-600">
                      <div className="inline-block px-3 py-1 bg-gray-100 rounded-lg text-sm font-medium text-gray-700 border border-gray-200">
                        {contact.subject}
                      </div>
                    </td>
                    <td className="p-4">
                      {isFlagged(contact) ? (
                        <span className="px-2.5 py-1 bg-red-50 text-red-600 border border-red-200 rounded-lg text-xs font-bold uppercase tracking-wider">Vi phạm / Spam</span>
                      ) : (
                        <span className="px-2.5 py-1 bg-green-50 text-green-600 border border-green-200 rounded-lg text-xs font-bold uppercase tracking-wider">Hợp lệ</span>
                      )}
                    </td>
                    <td className="p-4">
                      {getStatusBadge(contact.status)}
                    </td>
                    <td className="p-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-medium"
                        onClick={() => {
                          setSelectedContact({ ...contact, showContent: false })
                          setReplyMessage('')
                          setShowReplyModal(true)
                        }}
                      >
                        <Eye className="w-4 h-4 mr-2" /> Chi tiết
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-[var(--color-border)] flex items-center justify-between bg-gray-50/50">
            <span className="text-sm text-gray-600">
              Tổng số <strong className="text-gray-900">{totalElements}</strong> liên hệ
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                disabled={page === 0}
                onClick={() => load(page - 1)}
              >
                Trang trước
              </Button>
              <span className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm">
                Trang {page + 1} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                disabled={page >= totalPages - 1}
                onClick={() => load(page + 1)}
              >
                Trang sau
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Reply Modal */}
      <AnimatePresence>
        {showReplyModal && selectedContact && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowReplyModal(false)}
              className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white border border-[var(--color-border)] rounded-2xl p-6 w-full max-w-2xl shadow-2xl overflow-hidden"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-red-500" />
                  Chi tiết liên hệ #{selectedContact.id}
                </h3>
                <button
                  onClick={() => setShowReplyModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500 hover:text-gray-900"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 mb-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Người gửi</div>
                    <div className="text-base font-bold text-gray-900">{selectedContact.name}</div>
                    <div className="text-sm text-gray-600 mt-0.5">{selectedContact.email}</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Chủ đề</div>
                    <div className="text-base font-bold text-gray-900">{selectedContact.subject}</div>
                    {isFlagged(selectedContact) && (
                      <div className="text-xs text-red-600 mt-2 font-bold bg-red-100 border border-red-200 inline-block px-2.5 py-1 rounded-md uppercase tracking-wider">
                        AI Cảnh báo: Ngôn từ không phù hợp
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-gray-50 p-5 rounded-xl border border-gray-100 shadow-sm">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Nội dung tin nhắn:</div>
                  <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                    {isFlagged(selectedContact) && !selectedContact.showContent ? (
                      /* Hiển thị bản đã che từ vi phạm bằng *** */
                      <span className="text-gray-700">
                        {selectedContact.censoredMessage || selectedContact.message}
                      </span>
                    ) : (
                      selectedContact.message
                    )}
                  </p>
                  {isFlagged(selectedContact) && (
                     <div className="mt-4 pt-4 border-t border-gray-200 flex items-center gap-3">
                       {!selectedContact.showContent ? (
                         <Button 
                          size="sm" 
                          variant="outline"
                          className="bg-white border-red-200 text-red-600 hover:bg-red-50"
                          onClick={() => setSelectedContact({...selectedContact, showContent: true})}
                         >
                           <Eye className="w-4 h-4 mr-2" />
                           Hiển thị nội dung gốc
                         </Button>
                       ) : (
                         <Button 
                          size="sm" 
                          variant="outline"
                          className="bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                          onClick={() => setSelectedContact({...selectedContact, showContent: false})}
                         >
                           Ẩn nội dung gốc
                         </Button>
                       )}
                       <span className="text-xs text-gray-400 italic">
                         {selectedContact.showContent ? '⚠️ Đang hiển thị nội dung gốc chưa kiểm duyệt' : '🛡️ Nội dung đã được AI kiểm duyệt, các từ vi phạm được thay bằng ***'}
                       </span>
                     </div>
                  )}
                </div>

                {selectedContact.status === 'REPLIED' && selectedContact.responseMessage && (
                  <div className="bg-green-50 p-5 rounded-xl border border-green-200 shadow-sm">
                    <div className="text-xs font-bold text-green-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Nội dung đã phản hồi:
                    </div>
                    <p className="text-sm text-green-900 whitespace-pre-wrap leading-relaxed font-medium">{selectedContact.responseMessage}</p>
                  </div>
                )}
              </div>

              {selectedContact.status === 'PENDING' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Soạn phản hồi</label>
                    <textarea
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-200 transition-all min-h-[120px] shadow-sm"
                      placeholder="Nhập nội dung phản hồi. Hệ thống sẽ tự động gửi email cho người dùng..."
                    />
                  </div>
                  <div className="flex justify-end gap-3 pt-2">
                    <Button
                      variant="outline"
                      className="border-gray-300 text-gray-700 hover:bg-gray-50"
                      onClick={() => setShowReplyModal(false)}
                      disabled={replying}
                    >
                      Hủy
                    </Button>
                    <Button
                      onClick={handleReply}
                      disabled={!replyMessage.trim() || replying}
                      className="bg-red-600 hover:bg-red-700 text-white min-w-[140px] shadow-sm"
                    >
                      {replying ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" /> Gửi phản hồi
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

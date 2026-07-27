import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { concessionService, CONCESSION_ITEM_TYPES, ITEM_TYPE_EMOJIS, PRODUCT_SIZES, extractBaseName } from '../../../services/concessionService'
import Button from '../../../components/common/Button'
import Input from '../../../components/common/Input'
import { ArrowLeft, ChefHat, CheckCircle, AlertCircle, Sparkles, Smile, Upload, Loader2, X, Maximize2, Package, Plus } from 'lucide-react'

export default function ConcessionFormPage() {
  const { id } = useParams()
  const isEdit = !!id
  const navigate = useNavigate()

  // Form states
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [itemType, setItemType] = useState('food')
  const [imageUrl, setImageUrl] = useState('') // uploaded URL or emoji
  const [isActive, setIsActive] = useState(true)

  // Size states (multi-select for food & drink)
  const [selectedSizes, setSelectedSizes] = useState(['STANDARD'])
  const [sizePrices, setSizePrices] = useState({ STANDARD: '', L: '', XL: '' })

  // Combo collection states (Category Scope / Specific Products)
  const [availableProducts, setAvailableProducts] = useState([])
  const [comboItems, setComboItems] = useState([]) // [{ productUuid, productName, productSize, quantity }]
  const [selectedProductUuid, setSelectedProductUuid] = useState('')
  const [addQuantity, setAddQuantity] = useState(1)
  const [comboAddMode, setComboAddMode] = useState('category') // 'category' | 'specific'
  const [selectedCategoryType, setSelectedCategoryType] = useState('popcorn')
  const [selectedCategorySize, setSelectedCategorySize] = useState('L')

  // Upload states
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewSrc, setPreviewSrc] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef(null)
  const dropZoneRef = useRef(null)

  // UI States
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [toast, setToast] = useState(null)
  const [errors, setErrors] = useState({})

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  // Map existing DB variant UUIDs per size key when editing: { STANDARD: 'uuid1', L: 'uuid2', XL: 'uuid3' }
  const [existingVariantMap, setExistingVariantMap] = useState({})

  // Load available food, popcorn & drink products for building combo collection (Only Active, Not Deleted & Deduplicated)
  useEffect(() => {
    concessionService.getActive()
      .then(res => {
        const data = res.data?.result || res.data || []
        if (Array.isArray(data)) {
          const seenKeys = new Set()
          const uniqueSingleProds = []

          data.forEach(i => {
            if (!i) return
            const type = String(i.itemType || i.category || 'food').toLowerCase()
            const isSingle = type === 'popcorn' || type === 'food' || type === 'drink' || type === 'beverage'
            const isNotDeleted = i.isDeleted !== true
            const isActiveForSale = i.isActive !== false && String(i.status || '').toUpperCase() !== 'INACTIVE'

            if (isSingle && isNotDeleted && isActiveForSale) {
              const pName = (i.name || '').trim().toLowerCase()
              const pSize = (i.size || '').trim().toUpperCase()
              const pKey = `${pName}_${pSize}`

              if (!seenKeys.has(pKey)) {
                seenKeys.add(pKey)
                uniqueSingleProds.push(i)
              }
            }
          })

          // Sort available products: Alphabetical by base name A-Z, then smallest size to largest size (STANDARD -> L -> XL)
          const sizeOrder = { STANDARD: 1, S: 1, M: 2, L: 2, XL: 3 }
          uniqueSingleProds.sort((a, b) => {
            const baseA = extractBaseName(a.name)
            const baseB = extractBaseName(b.name)
            const cmp = baseA.localeCompare(baseB, 'vi', { sensitivity: 'base' })
            if (cmp !== 0) return cmp

            let szA = (a.size || 'STANDARD').toUpperCase()
            if (szA === 'S') szA = 'STANDARD'
            if (szA === 'M') szA = 'L'

            let szB = (b.size || 'STANDARD').toUpperCase()
            if (szB === 'S') szB = 'STANDARD'
            if (szB === 'M') szB = 'L'

            return (sizeOrder[szA] || 9) - (sizeOrder[szB] || 9)
          })

          setAvailableProducts(uniqueSingleProds)
          if (uniqueSingleProds.length > 0) {
            setSelectedProductUuid(uniqueSingleProds[0].id || uniqueSingleProds[0].uuid || '')
          } else {
            setSelectedProductUuid('')
          }
        }
      })
      .catch(err => console.error('Lỗi tải danh sách món lẻ:', err))
  }, [])

  // Pre-fill if editing (Atomic multi-size loading: Direct ID lookup + All sister size variants)
  useEffect(() => {
    if (!isEdit || !id) return

    let isMounted = true

    async function loadProductData() {
      try {
        const targetId = String(id || '').trim()

        // Fetch direct target item and full list in parallel
        const [itemRes, allRes] = await Promise.all([
          concessionService.getById(targetId).catch(e => {
            console.warn('Lỗi khi getById:', e)
            return null
          }),
          concessionService.getAll().catch(e => {
            console.warn('Lỗi khi getAll:', e)
            return null
          })
        ])

        if (!isMounted) return

        const targetItem = itemRes?.data?.result || itemRes?.data || null
        const rawList = allRes?.data?.result?.content || allRes?.data?.result || allRes?.data || []
        const allItems = Array.isArray(rawList) ? rawList : []

        // Extract base name from targetItem or id
        const rawTargetName = targetItem?.name || ''
        const baseNameFromItem = extractBaseName(rawTargetName)

        // Gather all sister items (variants) matching the base name or target ID
        const sisterItems = []
        if (targetItem) {
          sisterItems.push(targetItem)
        }

        if (allItems.length > 0) {
          allItems.forEach(item => {
            if (!item) return
            const itemId = String(item.id || item.uuid || '')
            const itemBaseName = extractBaseName(item.name || '')

            const isSameId = itemId && itemId === targetId
            const isSameBaseName = baseNameFromItem && itemBaseName && itemBaseName.toLowerCase() === baseNameFromItem.toLowerCase()

            if (isSameId || isSameBaseName) {
              const alreadyAdded = sisterItems.some(ex => String(ex.id || ex.uuid || '') === itemId)
              if (!alreadyAdded) {
                sisterItems.push(item)
              }
            }
          })
        }

        if (sisterItems.length === 0) {
          showToast('Không tìm thấy thông tin sản phẩm.', 'danger')
          return
        }

        // Primary reference item
        const refItem = targetItem || sisterItems[0]

        // 1. Name
        const mainName = baseNameFromItem || extractBaseName(refItem.name) || refItem.name || ''
        setName(mainName)

        // 2. Description
        const descVal = refItem.description || refItem.desc || sisterItems.find(i => i.description || i.desc)?.description || ''
        setDescription(descVal)

        // 3. Item Type
        let type = String(refItem.itemType || refItem.category || 'food').toLowerCase()
        if (type === 'beverage') type = 'drink'
        setItemType(type)

        // 4. Image & Status
        setImageUrl(refItem.imageUrl || refItem.img || '')
        setIsActive(refItem.isActive !== false)

        if (type === 'combo') {
          const itemPriceStr = refItem.price !== undefined && refItem.price !== null ? String(refItem.price) : ''
          setPrice(itemPriceStr)
          try {
            const cRes = await concessionService.getComboItems(targetId)
            const cItems = cRes.data?.result || cRes.data || []
            if (Array.isArray(cItems) && isMounted) setComboItems(cItems)
          } catch (err) {
            console.error('Lỗi tải thành phần combo:', err)
          }
        } else {
          // Food / Drink / Popcorn: Extract ALL sizes, prices, and variant UUIDs across sister items
          const loadedSizes = []
          const loadedPrices = { STANDARD: '', L: '', XL: '' }
          const loadedMap = {}

          sisterItems.forEach(item => {
            let sz = (item.size || 'STANDARD').toUpperCase()
            if (sz === 'S') sz = 'STANDARD'
            if (sz === 'M') sz = 'L'
            if (!['STANDARD', 'L', 'XL'].includes(sz)) sz = 'STANDARD'

            if (!loadedSizes.includes(sz)) {
              loadedSizes.push(sz)
            }
            const pVal = item.price !== undefined && item.price !== null ? String(item.price) : ''
            loadedPrices[sz] = pVal
            loadedMap[sz] = item.id || item.uuid || targetId
          })

          // Sort loadedSizes in order: STANDARD -> L -> XL
          const sizeOrder = { STANDARD: 1, L: 2, XL: 3 }
          loadedSizes.sort((a, b) => (sizeOrder[a] || 9) - (sizeOrder[b] || 9))

          if (loadedSizes.length > 0) {
            setSelectedSizes(loadedSizes)
            setSizePrices(loadedPrices)
            setExistingVariantMap(loadedMap)
            if (loadedSizes.length === 1) {
              setPrice(loadedPrices[loadedSizes[0]] || '')
            }
          }
        }
      } catch (err) {
        console.error('Lỗi tải dữ liệu sản phẩm:', err)
        if (isMounted) {
          showToast('Không thể tải dữ liệu sản phẩm.', 'danger')
        }
      }
    }

    loadProductData()

    return () => {
      isMounted = false
    }
  }, [id, isEdit])

  // Size Selection Toggle Handler (STANDARD, L, XL)
  const handleSizeToggle = (sizeKey) => {
    let nextSizes = [...selectedSizes]
    if (nextSizes.includes(sizeKey)) {
      nextSizes = nextSizes.filter(s => s !== sizeKey)
    } else {
      nextSizes.push(sizeKey)
    }

    // Đảm bảo luôn giữ ít nhất 1 size được tích chọn
    if (nextSizes.length === 0) {
      nextSizes = [sizeKey]
    }

    setSelectedSizes(nextSizes)
  }

  const handleSizePriceChange = (sizeKey, val) => {
    setSizePrices(prev => ({ ...prev, [sizeKey]: val }))
    if (selectedSizes.length === 1 && selectedSizes[0] === sizeKey) {
      setPrice(val)
    }
  }

  // Combo collection item handlers (Category Scope + Specific Items)
  const handleAddComboCategory = () => {
    // Find a representative product from availableProducts to meet DB foreign key constraints
    const repProd = availableProducts.find(p => {
      const type = String(p.itemType || p.category || '').toLowerCase()
      const pSz = (p.size || 'STANDARD').toUpperCase()
      return (type === selectedCategoryType || (selectedCategoryType === 'drink' && type === 'beverage')) &&
             (pSz === selectedCategorySize || pSz === 'L' || pSz === 'STANDARD')
    }) || availableProducts.find(p => {
      const type = String(p.itemType || p.category || '').toLowerCase()
      return type === selectedCategoryType || (selectedCategoryType === 'drink' && type === 'beverage')
    }) || availableProducts[0]

    if (!repProd) {
      showToast('Cần có ít nhất 1 sản phẩm món lẻ trong hệ thống để tạo thành phần combo.', 'danger')
      return
    }

    const categoryNames = {
      popcorn: 'Bắp rang (Tùy chọn vị)',
      drink: 'Nước ngọt / Đồ uống (Tùy chọn loại nước)',
      food: 'Đồ ăn khác'
    }

    const nameToUse = categoryNames[selectedCategoryType] || 'Món lẻ tùy chọn'
    const pUuid = repProd.id || repProd.uuid

    setComboItems(prev => {
      const existingIdx = prev.findIndex(ci => ci.productUuid === pUuid && ci.productSize === selectedCategorySize)
      if (existingIdx >= 0) {
        const updated = [...prev]
        updated[existingIdx] = {
          ...updated[existingIdx],
          quantity: updated[existingIdx].quantity + addQuantity
        }
        return updated
      } else {
        return [...prev, {
          productUuid: pUuid,
          productName: nameToUse,
          productSize: selectedCategorySize,
          quantity: addQuantity
        }]
      }
    })
    showToast(`Đã thêm "${nameToUse} (${selectedCategorySize})" vào combo!`)
  }

  const handleAddComboItem = () => {
    if (!selectedProductUuid) return
    const prod = availableProducts.find(p => p.id === selectedProductUuid)
    if (!prod) return

    setComboItems(prev => {
      const existingIdx = prev.findIndex(ci => ci.productUuid === selectedProductUuid)
      if (existingIdx >= 0) {
        const updated = [...prev]
        updated[existingIdx] = {
          ...updated[existingIdx],
          quantity: updated[existingIdx].quantity + addQuantity
        }
        return updated
      } else {
        return [...prev, {
          productUuid: prod.id,
          productName: prod.name,
          productSize: prod.size,
          quantity: addQuantity
        }]
      }
    })
    showToast(`Đã thêm "${prod.name}" vào combo!`)
  }

  const handleUpdateComboItemQuantity = (productUuid, delta) => {
    setComboItems(prev => {
      return prev.map(ci => {
        if (ci.productUuid === productUuid) {
          const newQty = ci.quantity + delta
          return newQty > 0 ? { ...ci, quantity: newQty } : null
        }
        return ci
      }).filter(Boolean)
    })
  }

  const handleRemoveComboItem = (productUuid) => {
    setComboItems(prev => prev.filter(ci => ci.productUuid !== productUuid))
  }

  // Helper: calculate unit retail price for a combo item based on available products or category
  const getItemUnitPrice = (ci) => {
    if (!ci) return 0

    // 1. Direct UUID match
    if (ci.productUuid) {
      const directMatch = availableProducts.find(
        p => String(p.id || p.uuid) === String(ci.productUuid)
      )
      if (directMatch && Number(directMatch.price) > 0) {
        return Number(directMatch.price)
      }
    }

    // 2. Match by category type & size
    const normName = (ci.productName || '').toLowerCase()
    const normSize = (ci.productSize || 'STANDARD').toUpperCase()

    let targetType = ''
    if (normName.includes('bắp') || normName.includes('popcorn')) targetType = 'popcorn'
    else if (normName.includes('nước') || normName.includes('drink') || normName.includes('coca') || normName.includes('pepsi') || normName.includes('đồ uống')) targetType = 'drink'
    else targetType = 'food'

    const matchingProds = availableProducts.filter(p => {
      const pType = String(p.itemType || p.category || '').toLowerCase()
      const pSz = (p.size || 'STANDARD').toUpperCase()
      const typeMatches = targetType === 'drink'
        ? (pType === 'drink' || pType === 'beverage')
        : pType === targetType
      return typeMatches && (pSz === normSize || (normSize === 'STANDARD' && (pSz === 'S' || pSz === 'STANDARD')))
    })

    if (matchingProds.length > 0) {
      const sum = matchingProds.reduce((acc, curr) => acc + (Number(curr.price) || 0), 0)
      return Math.round(sum / matchingProds.length)
    }

    // 3. Fallback: match any product in category
    const fallbackTypeProds = availableProducts.filter(p => {
      const pType = String(p.itemType || p.category || '').toLowerCase()
      return targetType === 'drink' ? (pType === 'drink' || pType === 'beverage') : pType === targetType
    })

    if (fallbackTypeProds.length > 0) {
      const sum = fallbackTypeProds.reduce((acc, curr) => acc + (Number(curr.price) || 0), 0)
      return Math.round(sum / fallbackTypeProds.length)
    }

    return 0
  }

  // Total retail price of all combo items combined
  const totalRetailPrice = comboItems.reduce((sum, ci) => {
    const unitPrice = getItemUnitPrice(ci)
    return sum + (unitPrice * (ci.quantity || 1))
  }, 0)

  const validate = () => {
    const newErrors = {}
    if (!name.trim()) newErrors.name = 'Tên món ăn / combo không được bỏ trống.'
    if (!itemType) newErrors.itemType = 'Phải chọn phân loại sản phẩm.'

    if (itemType !== 'combo') {
      if (selectedSizes.length === 0) {
        newErrors.size = 'Vui lòng chọn ít nhất một kích thước (Size).'
      }
      selectedSizes.forEach(sKey => {
        const val = sizePrices[sKey]
        if (val === '' || val === undefined || val === null) {
          newErrors[`price_${sKey}`] = `Nhập giá cho ${sKey}`
        } else if (isNaN(Number(val)) || Number(val) < 0) {
          newErrors[`price_${sKey}`] = 'Giá phải >= 0đ'
        }
      })
    } else {
      if (price === '') {
        newErrors.price = 'Giá bán không được bỏ trống.'
      } else if (isNaN(Number(price)) || Number(price) < 0) {
        newErrors.price = 'Giá bán phải là số hợp lệ từ 0đ.'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // ===== Upload handlers =====
  const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
  const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

  const isHttpUrl = (s) =>
    typeof s === 'string' && (s.startsWith('http') || s.startsWith('/') || s.startsWith('data:'))

  const validateAndSetFile = (file) => {
    if (!file) return null
    if (!file.type || !ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      showToast('Chỉ chấp nhận file ảnh (JPG, PNG, WEBP, GIF).', 'danger')
      return null
    }
    if (file.size > MAX_FILE_SIZE) {
      showToast('Kích thước ảnh vượt quá 5MB. Vui lòng chọn ảnh nhỏ hơn.', 'danger')
      return null
    }
    setSelectedFile(file)
    const reader = new FileReader()
    reader.onloadend = () => setPreviewSrc(reader.result)
    reader.readAsDataURL(file)
    return file
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      const f = validateAndSetFile(file)
      if (f) autoUpload(f)
    }
  }

  // Xử lý dán ảnh từ clipboard (Ctrl+V)
  useEffect(() => {
    const handlePaste = (e) => {
      const items = e.clipboardData?.items
      if (!items) return
      for (const item of items) {
        if (item.type && item.type.startsWith('image/')) {
          const file = item.getAsFile()
          if (file) {
            e.preventDefault()
            const f = validateAndSetFile(file)
            if (f) {
              autoUpload(f)
              showToast('Đã dán ảnh từ clipboard, đang tải lên...')
            }
            return
          }
        }
      }
    }
    window.addEventListener('paste', handlePaste)
    return () => window.removeEventListener('paste', handlePaste)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!isDragging) setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    const file = e.dataTransfer?.files?.[0]
    if (file) {
      const f = validateAndSetFile(file)
      if (f) autoUpload(f)
    }
  }

  const autoUpload = async (file) => {
    setIsUploading(true)
    try {
      const res = await concessionService.uploadImage(file)
      const uploadedUrl = res.data?.result || res.data
      if (!uploadedUrl) {
        throw new Error('Không nhận được URL ảnh từ server.')
      }
      setImageUrl(uploadedUrl)
      showToast('Tải ảnh lên thành công!')
    } catch (err) {
      console.error('Lỗi khi upload ảnh:', err)
      const msg = err.response?.data?.message || 'Tải ảnh lên thất bại. Vui lòng thử lại.'
      showToast(msg, 'danger')
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemoveSelectedFile = () => {
    setSelectedFile(null)
    setPreviewSrc('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setIsSubmitting(true)

    try {
      if (itemType === 'combo') {
        const payload = {
          name: name.trim(),
          description: description.trim(),
          price: Number(price),
          itemType: 'combo',
          imageUrl: imageUrl.trim() || ITEM_TYPE_EMOJIS['combo'],
          size: null,
          isActive
        }
        let comboId = id
        if (isEdit) {
          await concessionService.update(id, payload)
        } else {
          const res = await concessionService.create(payload)
          const created = res.data?.result || res.data
          comboId = created?.id || created?.uuid
        }

        // Cập nhật danh sách các món lẻ thành phần trong Combo nếu có
        if (comboId && comboItems.length > 0) {
          const reqList = comboItems.map(ci => ({
            productUuid: ci.productUuid,
            quantity: Number(ci.quantity) || 1
          }))
          await concessionService.updateComboItems(comboId, reqList)
        }

        showToast(isEdit ? 'Cập nhật combo thành công!' : 'Thêm combo mới thành công!')
      } else {
        // Món lẻ (Đồ ăn / Đồ uống / Bắp rang)
        if (isEdit) {
          // Cập nhật hoặc tạo mới từng size variant được chọn
          for (const sKey of selectedSizes) {
            const itemPrice = Number(sizePrices[sKey] || price || 0)
            const sizeTag = selectedSizes.length > 1
              ? (sKey === 'STANDARD' ? ' (Tiêu chuẩn)' : sKey === 'L' ? ' (Lớn)' : ' (Siêu lớn)')
              : ''
            const payload = {
              name: `${name.trim()}${sizeTag}`,
              description: description.trim(),
              price: itemPrice,
              itemType,
              imageUrl: imageUrl.trim() || ITEM_TYPE_EMOJIS[itemType],
              size: sKey,
              isActive
            }

            const existingUuid = existingVariantMap[sKey]
            if (existingUuid) {
              await concessionService.update(existingUuid, payload)
            } else {
              await concessionService.create(payload)
            }
          }

          // Xóa biến thể bị bỏ tích chọn trong lúc Edit
          const existingKeys = Object.keys(existingVariantMap)
          for (const exKey of existingKeys) {
            if (!selectedSizes.includes(exKey) && existingVariantMap[exKey]) {
              try {
                await concessionService.delete(existingVariantMap[exKey])
              } catch (e) {
                console.warn('Lỗi khi xóa biến thể size bỏ chọn:', e)
              }
            }
          }

          showToast('Cập nhật thông tin sản phẩm thành công!')
        } else {
          const payloads = selectedSizes.map(sKey => {
            const itemPrice = Number(sizePrices[sKey] || price || 0)
            const sizeTag = selectedSizes.length > 1
              ? (sKey === 'STANDARD' ? ' (Tiêu chuẩn)' : sKey === 'L' ? ' (Lớn)' : ' (Siêu lớn)')
              : ''
            return {
              name: `${name.trim()}${sizeTag}`,
              description: description.trim(),
              price: itemPrice,
              itemType,
              imageUrl: imageUrl.trim() || ITEM_TYPE_EMOJIS[itemType],
              size: sKey,
              isActive
            }
          })
          await concessionService.createMultiSize(payloads)
          showToast(`Đã thêm thành công ${payloads.length} sản phẩm theo các bậc size!`)
        }
      }

      setTimeout(() => {
        navigate('/admin/concessions')
      }, 1000)
    } catch (err) {
      console.error('Lỗi khi lưu sản phẩm:', err)
      const errorMsg = err.response?.data?.message || 'Có lỗi xảy ra khi lưu dữ liệu.'
      showToast(errorMsg, 'danger')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 text-left max-w-4xl mx-auto">
      {/* Toast Alert */}
      {toast && (
        <div
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl border text-sm max-w-sm transition-all duration-300 animate-slide-in-up"
          style={{
            backgroundColor: toast.type === 'danger' ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)',
            borderColor: toast.type === 'danger' ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)',
            color: toast.type === 'danger' ? '#ef4444' : '#10b981',
            backdropFilter: 'blur(16px)'
          }}
        >
          {toast.type === 'danger' ? <AlertCircle size={20} /> : <CheckCircle size={20} />}
          <span className="font-medium">{toast.message}</span>
        </div>
      )}

      {/* Navigation Header */}
      <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/admin/concessions')}
            className="p-2 bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-red-500/50 hover:text-red-500 rounded-xl transition-all cursor-pointer text-[var(--color-on-surface)]"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-3xl text-[var(--color-on-surface)] font-extrabold tracking-wider uppercase flex items-center gap-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              <ChefHat className="text-red-500" size={24} />
              {isEdit ? 'Sửa thông tin sản phẩm' : 'Thêm món ăn/combo mới'}
            </h1>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">
              {isEdit ? 'Cập nhật lại giá bán, hình ảnh hoặc trạng thái hoạt động.' : 'Thiết lập tên món, mô tả, phân loại danh mục, kích thước và giá thành.'}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Main form details */}
        <div className="lg:col-span-2 space-y-6 bg-[var(--color-surface)] border border-[var(--color-border)] p-6 md:p-8 rounded-2xl shadow-xl">
          <h2 className="text-lg font-bold text-gray-500 flex items-center gap-2 mb-4 border-b border-[var(--color-border)] pb-3">
            <Sparkles size={18} className="text-yellow-500" /> Thông tin cơ bản
          </h2>

          <div className="space-y-4">
            <div>
              <span className="text-xs font-bold tracking-wider text-gray-500 uppercase block mb-2">Tên món ăn / Combo *</span>
              <Input
                placeholder="VD: Combo Couple / Bắp Rang Bơ / Coca Cola"
                value={name}
                onChange={(e) => setName(e.target.value)}
                error={errors.name}
              />
            </div>

            <div>
              <span className="text-xs font-bold tracking-wider text-gray-500 uppercase block mb-2">Mô tả chi tiết</span>
              <textarea
                placeholder="Mô tả thành phần, vị bắp hoặc dung tích cốc nước..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full bg-[var(--color-surface-2)] border rounded-xl py-3 px-4 outline-none text-sm text-gray-500 transition-all focus:border-red-500 focus:shadow-[0_0_10px_rgba(229,9,20,0.2)]"
                style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}
              />
            </div>

            <div>
              <span className="text-xs font-bold tracking-wider text-gray-500 uppercase block mb-2">Phân loại danh mục *</span>
              <select
                value={itemType}
                onChange={(e) => setItemType(e.target.value)}
                className="w-full bg-[var(--color-surface-2)] border rounded-xl py-3 px-4 outline-none text-sm text-gray-500 transition-all focus:border-red-500 focus:shadow-[0_0_10px_rgba(229,9,20,0.2)] h-[46px]"
                style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}
              >
                <option value="popcorn">Bắp rang (Popcorn)</option>
                <option value="food">Đồ ăn khác (Food)</option>
                <option value="drink">Đồ uống (Drink)</option>
                <option value="combo">Combo bắp nước</option>
              </select>
              {errors.itemType && <span className="text-[10px] text-red-500 font-semibold mt-1 block">{errors.itemType}</span>}
            </div>

            {/* Size selection section for Food & Drink */}
            {itemType !== 'combo' && (
              <div className="space-y-3 pt-4 border-t border-[var(--color-border)]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <span className="text-xs font-bold tracking-wider text-gray-500 uppercase flex items-center gap-2">
                    <Maximize2 size={16} className="text-blue-500" /> Kích thước (Size) *
                  </span>
                </div>

                {/* Size Selector Buttons */}
                <div className="grid grid-cols-3 gap-3">
                  {PRODUCT_SIZES.map((s) => {
                    const isSelected = selectedSizes.includes(s.key)
                    return (
                      <button
                        key={s.key}
                        type="button"
                        onClick={() => handleSizeToggle(s.key)}
                        className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                          isSelected
                            ? 'bg-red-500/10 border-red-500 text-white shadow-[0_0_12px_rgba(229,9,20,0.25)]'
                            : 'bg-[var(--color-surface-2)] border-[var(--color-border)] text-gray-400 hover:border-gray-500 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full mb-1">
                          <span className={`font-extrabold text-sm ${isSelected ? 'text-red-400' : 'text-gray-300'}`}>
                            {s.label}
                          </span>
                          <span className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] ${
                            isSelected ? 'border-red-500 bg-red-500 text-white' : 'border-gray-600'
                          }`}>
                            {isSelected ? '✓' : ''}
                          </span>
                        </div>
                        <span className="text-[11px] text-[var(--color-text-muted)] truncate">{s.name}</span>
                      </button>
                    )
                  })}
                </div>
                {errors.size && <span className="text-[10px] text-red-500 font-semibold block">{errors.size}</span>}
              </div>
            )}

            {/* Dynamic Price Inputs section per selected size */}
            {itemType !== 'combo' ? (
              <div className="space-y-4 pt-4 border-t border-[var(--color-border)]">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
                  Giá bán cho từng bậc Size đã chọn *
                </span>
                <div className={`grid grid-cols-1 ${selectedSizes.length > 1 ? 'sm:grid-cols-3' : 'sm:grid-cols-1'} gap-4 items-stretch`}>
                  {selectedSizes.map(sKey => {
                    const sObj = PRODUCT_SIZES.find(s => s.key === sKey)
                    const sizeTitle = sObj ? sObj.label : sKey
                    return (
                      <div key={sKey} className="bg-[var(--color-surface-2)] p-3.5 rounded-xl border border-[var(--color-border)] flex flex-col justify-between">
                        <span className="text-xs font-bold text-red-400 uppercase mb-2 min-h-[36px] flex items-center">
                          Giá bán {sizeTitle} (VNĐ) *
                        </span>
                        <Input
                          type="number"
                          placeholder="Nhập giá..."
                          value={sizePrices[sKey] ?? ''}
                          onChange={(e) => handleSizePriceChange(sKey, e.target.value)}
                          error={errors[`price_${sKey}`]}
                        />
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Reference Retail Price Card & Smart Suggestion for Admin */}
                <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border border-amber-500/30 text-gray-800 dark:text-gray-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-500/20 pb-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg">🛒</span>
                        <span className="text-xs font-extrabold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                          Giá bán lẻ tham khảo (Tổng các món cộng lại)
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                        Được tự động tính từ giá bán lẻ của các món thành phần được thêm ở bên dưới.
                      </p>
                    </div>

                    <div className="text-right sm:text-right">
                      <span className="text-xl font-black text-amber-700 dark:text-amber-400 tracking-tight block">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalRetailPrice)}
                      </span>
                      {comboItems.length === 0 && (
                        <span className="text-[10px] text-gray-400 italic">Chưa chọn món nào vào combo</span>
                      )}
                    </div>
                  </div>

                  {/* Smart Price Suggestions & Comparisons */}
                  {totalRetailPrice > 0 && (
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-2 flex-wrap text-xs">
                        <span className="font-bold text-gray-700 dark:text-gray-300">Gợi ý giá combo (ưu đãi hơn mua lẻ):</span>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {[10, 15, 20, 25].map(discountPercent => {
                            const suggestedPrice = Math.round((totalRetailPrice * (1 - discountPercent / 100)) / 1000) * 1000
                            const isCurrent = String(price) === String(suggestedPrice)
                            return (
                              <button
                                key={discountPercent}
                                type="button"
                                onClick={() => setPrice(String(suggestedPrice))}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                                  isCurrent
                                    ? 'bg-amber-600 text-white border-amber-600 shadow-xs scale-105'
                                    : 'bg-white dark:bg-gray-800 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700 hover:bg-amber-100 dark:hover:bg-gray-700'
                                }`}
                                title={`Áp dụng giảm ${discountPercent}% so với mua lẻ`}
                              >
                                -{discountPercent}% ({new Intl.NumberFormat('vi-VN').format(suggestedPrice)}đ)
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      {/* Dynamic comparison feedback on current price */}
                      {price && !isNaN(Number(price)) && Number(price) > 0 && (
                        <div className="pt-2 border-t border-amber-500/20">
                          {Number(price) < totalRetailPrice ? (
                            <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 p-2.5 rounded-lg border border-emerald-500/20">
                              <span>🎉</span>
                              <span>
                                Giá combo giúp khách hàng tiết kiệm được <strong>{new Intl.NumberFormat('vi-VN').format(totalRetailPrice - Number(price))} VNĐ</strong> ({((1 - Number(price) / totalRetailPrice) * 100).toFixed(1)}% hời hơn mua lẻ)
                              </span>
                            </div>
                          ) : Number(price) === totalRetailPrice ? (
                            <div className="flex items-center gap-2 text-xs font-semibold text-amber-700 dark:text-amber-400 bg-amber-500/10 p-2.5 rounded-lg border border-amber-500/20">
                              <span>ℹ️</span>
                              <span>Giá combo bằng đúng tổng giá mua lẻ. Bạn nên hạ giá một chút để combo có ưu đãi thu hút hơn.</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-xs font-bold text-red-600 dark:text-red-400 bg-red-500/10 p-2.5 rounded-lg border border-red-500/20">
                              <span>⚠️</span>
                              <span>
                                Chú ý: Giá combo đang ĐẮT HƠN tổng giá mua lẻ ({new Intl.NumberFormat('vi-VN').format(Number(price) - totalRetailPrice)} VNĐ). Khách hàng sẽ ưu tiên chọn mua lẻ từng món.
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Combo Price Input */}
                <div>
                  <span className="text-xs font-bold tracking-wider text-gray-500 uppercase block mb-2">
                    Giá bán Combo chính thức (VNĐ) *
                  </span>
                  <Input
                    type="number"
                    placeholder="VD: 95000"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    error={errors.price}
                  />
                </div>
              </div>
            )}

            {/* Combo Collection Section (Category Scope / Specific Item selection) */}
            {itemType === 'combo' && (
              <div className="space-y-4 pt-4 border-t border-[var(--color-border)]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <span className="text-xs font-bold tracking-wider text-gray-600 uppercase flex items-center gap-2">
                    <Package size={16} className="text-red-500" /> Thành phần trong gói Combo *
                  </span>
                  <span className="text-[11px] text-gray-400 italic">
                    (Thiết lập các thành phần danh mục hoặc món cụ thể cho combo)
                  </span>
                </div>

                {/* Mode Selector Tabs */}
                <div className="flex items-center gap-2 border-b border-[var(--color-border)] pb-2">
                  <button
                    type="button"
                    onClick={() => setComboAddMode('category')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      comboAddMode === 'category'
                        ? 'bg-red-600 text-white shadow-sm'
                        : 'bg-[var(--color-surface-2)] text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    🎯 Theo Phân loại Danh mục (Khuyên dùng)
                  </button>
                  <button
                    type="button"
                    onClick={() => setComboAddMode('specific')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      comboAddMode === 'specific'
                        ? 'bg-red-600 text-white shadow-sm'
                        : 'bg-[var(--color-surface-2)] text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    🍿 Theo Món cụ thể
                  </button>
                </div>

                {/* Controls to add a Category Component or Specific Product */}
                {comboAddMode === 'category' ? (
                  <div className="flex flex-col sm:flex-row items-center gap-3 bg-[var(--color-surface-2)] p-3.5 rounded-xl border border-[var(--color-border)]">
                    <div className="flex-1 grid grid-cols-2 gap-2 w-full">
                      {/* Select Category */}
                      <select
                        value={selectedCategoryType}
                        onChange={(e) => setSelectedCategoryType(e.target.value)}
                        className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg py-2.5 px-3 outline-none text-xs font-semibold text-gray-700 focus:border-red-500"
                      >
                        <option value="popcorn">🍿 Bắp rang (Cho phép chọn vị)</option>
                        <option value="drink">🥤 Đồ uống (Cho phép chọn loại nước)</option>
                        <option value="food">🍔 Đồ ăn khác</option>
                      </select>

                      {/* Select Size */}
                      <select
                        value={selectedCategorySize}
                        onChange={(e) => setSelectedCategorySize(e.target.value)}
                        className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg py-2.5 px-3 outline-none text-xs font-semibold text-gray-700 focus:border-red-500"
                      >
                        <option value="STANDARD">Size Tiêu chuẩn (STANDARD)</option>
                        <option value="L">Size Lớn (L)</option>
                        <option value="XL">Size Siêu lớn (XL)</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
                      <div className="flex items-center gap-1.5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg px-3 py-1.5">
                        <span className="text-xs font-bold text-gray-500">SL:</span>
                        <input
                          type="number"
                          min="1"
                          value={addQuantity}
                          onChange={(e) => setAddQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-10 text-center bg-transparent text-xs text-gray-800 outline-none font-extrabold"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={handleAddComboCategory}
                        className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm whitespace-nowrap"
                      >
                        <Plus size={14} /> Thêm vào Combo
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row items-center gap-3 bg-[var(--color-surface-2)] p-3.5 rounded-xl border border-[var(--color-border)]">
                    <div className="flex-1 w-full">
                      <select
                        value={selectedProductUuid}
                        onChange={(e) => setSelectedProductUuid(e.target.value)}
                        className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg py-2.5 px-3 outline-none text-xs font-semibold text-gray-700 focus:border-red-500"
                      >
                        {availableProducts.length === 0 && <option value="" className="text-gray-500">Không có món lẻ nào trong hệ thống</option>}
                        {availableProducts.map(p => (
                          <option key={p.id} value={p.id} className="text-gray-700 bg-white">
                            {p.name} {p.size ? `(${p.size})` : ''} - {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p.price)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
                      <div className="flex items-center gap-1.5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg px-3 py-1.5">
                        <span className="text-xs font-bold text-gray-500">SL:</span>
                        <input
                          type="number"
                          min="1"
                          value={addQuantity}
                          onChange={(e) => setAddQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-10 text-center bg-transparent text-xs text-gray-800 outline-none font-extrabold"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={handleAddComboItem}
                        disabled={!selectedProductUuid}
                        className="px-4 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm whitespace-nowrap"
                      >
                        <Plus size={14} /> Thêm món
                      </button>
                    </div>
                  </div>
                )}

                {/* Display combo items collection */}
                {comboItems.length > 0 ? (
                  <div className="space-y-2.5">
                    <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
                      Các món trong gói combo này ({comboItems.length} loại món):
                    </span>
                    <div className="space-y-2">
                      {comboItems.map((ci) => {
                        const itemTypeIcon = (ci.productName || '').toLowerCase().includes('bắp') || (ci.productName || '').toLowerCase().includes('popcorn')
                          ? '🍿'
                          : (ci.productName || '').toLowerCase().includes('nước') || (ci.productName || '').toLowerCase().includes('coca') || (ci.productName || '').toLowerCase().includes('pepsi')
                          ? '🥤'
                          : '🍔'

                        const unitPrice = getItemUnitPrice(ci)
                        const lineTotal = unitPrice * (ci.quantity || 1)

                        return (
                          <div
                            key={ci.productUuid}
                            className="flex items-center justify-between p-3.5 bg-[var(--color-surface-2)] rounded-xl border border-[var(--color-border)] hover:border-red-500/30 transition-all shadow-sm"
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-base p-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg shadow-2xs">{itemTypeIcon}</span>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-sm text-gray-800 dark:text-gray-200">{ci.productName || 'Sản phẩm lẻ'}</span>
                                  {ci.productSize && (
                                    <span className="px-2 py-0.5 rounded-md bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 text-[10px] font-extrabold uppercase tracking-wider">
                                      {ci.productSize}
                                    </span>
                                  )}
                                </div>
                                {unitPrice > 0 && (
                                  <div className="text-[11px] text-gray-500 dark:text-gray-400 font-medium mt-0.5">
                                    Đơn giá mua lẻ: {new Intl.NumberFormat('vi-VN').format(unitPrice)}đ
                                    {ci.quantity > 1 && (
                                      <span className="text-amber-700 dark:text-amber-400 font-bold ml-1">
                                        ➔ Tổng: {new Intl.NumberFormat('vi-VN').format(lineTotal)}đ
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              {/* Quantity Controls (- / number / +) */}
                              <div className="flex items-center bg-[var(--color-surface)] rounded-lg border border-[var(--color-border)] p-1">
                                <button
                                  type="button"
                                  onClick={() => handleUpdateComboItemQuantity(ci.productUuid, -1)}
                                  className="w-6 h-6 flex items-center justify-center rounded text-gray-600 hover:bg-gray-200 font-extrabold transition-colors cursor-pointer text-xs"
                                >
                                  -
                                </button>
                                <span className="font-bold text-gray-800 dark:text-gray-200 text-xs px-2.5 min-w-[24px] text-center">{ci.quantity}</span>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateComboItemQuantity(ci.productUuid, 1)}
                                  className="w-6 h-6 flex items-center justify-center rounded text-gray-600 hover:bg-gray-200 font-extrabold transition-colors cursor-pointer text-xs"
                                >
                                  +
                                </button>
                              </div>

                              {/* Remove Button */}
                              <button
                                type="button"
                                onClick={() => handleRemoveComboItem(ci.productUuid)}
                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                title="Xóa món khỏi combo"
                              >
                                <X size={16} />
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {/* Summary row for combo items total retail price */}
                    {totalRetailPrice > 0 && (
                      <div className="flex items-center justify-between p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs font-extrabold text-amber-800 dark:text-amber-300 mt-3">
                        <span>TỔNG GIÁ MUA LẺ CÁC MÓN TRONG COMBO:</span>
                        <span className="text-sm font-black text-amber-700 dark:text-amber-400">
                          {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalRetailPrice)}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl border border-dashed border-[var(--color-border)] text-center bg-[var(--color-surface-2)]/50">
                    <p className="text-xs text-gray-400">Chưa có món lẻ nào được thêm vào combo này. Vui lòng chọn món và bấm "Thêm món".</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right column: Image & status */}
        <div className="space-y-6">
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-6 rounded-2xl shadow-xl flex flex-col items-center">
            <h2 className="text-base font-bold text-gray-500 flex items-center gap-2 self-start mb-4 border-b border-[var(--color-border)] pb-3 w-full">
              <Smile size={18} className="text-blue-500" /> Ảnh minh hoạ
            </h2>

            {/* Preview + Drop zone */}
            <div
              ref={dropZoneRef}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative w-full aspect-square max-w-[220px] rounded-2xl bg-[var(--color-surface-2)] border-2 border-dashed flex items-center justify-center text-5xl mb-4 select-none overflow-hidden cursor-pointer transition-all
                ${isDragging
                  ? 'border-red-500 bg-red-500/10 scale-105'
                  : 'border-[var(--color-border)] hover:border-red-500/60 hover:bg-[var(--color-surface-2)]/80'}
              `}
              title="Kéo thả ảnh vào đây, click để chọn file, hoặc nhấn Ctrl+V để dán ảnh"
            >
              {previewSrc ? (
                <img src={previewSrc} alt="preview" className="w-full h-full object-cover" />
              ) : imageUrl && isHttpUrl(imageUrl) ? (
                <img src={imageUrl} alt="preview" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center gap-2 text-[var(--color-text-muted)]">
                  <Upload size={36} className="opacity-50" />
                  <span className="text-xs font-semibold text-[var(--color-text-muted)]">Kéo ảnh vào đây</span>
                </div>
              )}

              {/* Overlay khi đang upload */}
              {isUploading && (
                <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-2 backdrop-blur-sm">
                  <Loader2 size={32} className="text-red-500 animate-spin" />
                  <span className="text-xs text-gray-500 font-semibold">Đang tải lên...</span>
                </div>
              )}

              {/* Hint khi kéo thả */}
              {isDragging && !isUploading && (
                <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center pointer-events-none">
                  <span className="text-gray-500 font-bold text-sm">Thả ảnh vào đây!</span>
                </div>
              )}
            </div>

            {/* File picker (ẩn - click vào drop zone để mở) */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />

            {selectedFile && !isUploading && (
              <div className="w-full flex items-center justify-between gap-2 p-2 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-border)] mb-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 truncate">{selectedFile.name}</p>
                  <p className="text-[10px] text-[var(--color-text-muted)]">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleRemoveSelectedFile() }}
                  className="p-1.5 text-gray-500 hover:text-red-400 cursor-pointer"
                  title="Bỏ chọn file"
                >
                  <X size={14} />
                </button>
              </div>
            )}

          </div>

          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-6 rounded-2xl shadow-xl">
            <h2 className="text-base font-bold text-gray-500 flex items-center gap-2 mb-4 border-b border-[var(--color-border)] pb-3 w-full">
              Trạng thái kinh doanh
            </h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-500">Cho phép bán</p>
                <p className="text-xs text-[var(--color-text-muted)] mt-0.5">Khách và nhân viên có thể nhìn thấy sản phẩm này</p>
              </div>
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-5 h-5 accent-red-500 cursor-pointer"
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-2 w-full">
            <Button
              className="w-full py-3.5 text-sm font-bold shadow-lg uppercase tracking-wider"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? 'Đang lưu...' : isEdit ? 'Cập nhật sản phẩm' : 'Thêm mới sản phẩm'}
            </Button>
            <Button
              variant="secondary"
              onClick={() => navigate('/admin/concessions')}
              className="w-full py-3 text-sm font-semibold text-[var(--color-on-surface)]"
              type="button"
            >
              Hủy bỏ
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}

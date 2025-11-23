import { useEffect, useState } from "react"
import { Layout } from "../Layout/Layout"
import { useUser } from "../../context/UserProvider"
import {
  getUserTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  TEMPLATE_TYPES,
  extractPlaceholders,
  downloadTemplates,
  importTemplatesFromFile
} from "../../js/templateService"
import { ErrorLabel } from "../ErrorLabel/ErrorLabel"
import { SuccessLabel } from "../SuccessLabel/SuccessLabel"
import { Loading3QuartersOutlined, EditOutlined, DeleteOutlined, PlusOutlined, DownloadOutlined, UploadOutlined } from "@ant-design/icons"

export const TemplatePage = () => {
  const [user] = useUser()
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  
  // Form state
  const [editingTemplate, setEditingTemplate] = useState(null)
  const [formType, setFormType] = useState(TEMPLATE_TYPES.ESTIMATE)
  const [formContent, setFormContent] = useState("")
  const [formName, setFormName] = useState("")
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    loadTemplates()
  }, [user])

  const loadTemplates = async () => {
    if (!user) return
    
    setLoading(true)
    setError(null)
    try {
      const userTemplates = await getUserTemplates(user.id)
      setTemplates(userTemplates)
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Lỗi khi tải templates"))
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setEditingTemplate(null)
    setFormType(TEMPLATE_TYPES.ESTIMATE)
    setFormContent("")
    setFormName("")
    setShowForm(true)
    setError(null)
    setSuccess(null)
  }

  const handleEdit = template => {
    setEditingTemplate(template)
    setFormType(template.type)
    setFormContent(template.content)
    setFormName(template.name || "")
    setShowForm(true)
    setError(null)
    setSuccess(null)
  }

  const handleDelete = async templateId => {
    if (!confirm("Bạn có chắc chắn muốn xóa template này?")) return

    setError(null)
    try {
      await deleteTemplate(templateId)
      setSuccess("Đã xóa template thành công")
      await loadTemplates()
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Lỗi khi xóa template"))
    }
  }

  const handleExport = async () => {
    setError(null)
    try {
      await downloadTemplates(user?.id)
      setSuccess("Đã export templates thành công")
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Lỗi khi export templates"))
    }
  }

  const handleImport = async e => {
    const file = e.target.files[0]
    if (!file) return

    setError(null)
    setSuccess(null)

    if (!confirm("Bạn có muốn merge templates này với templates hiện có không? (Chọn OK để merge, Cancel để replace)")) {
      // Replace all
      try {
        await importTemplatesFromFile(file, false)
        setSuccess("Đã import templates thành công (replace all)")
        await loadTemplates()
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Lỗi khi import templates"))
      }
    } else {
      // Merge
      try {
        await importTemplatesFromFile(file, true)
        setSuccess("Đã import templates thành công (merged)")
        await loadTemplates()
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Lỗi khi import templates"))
      }
    }

    // Reset file input
    e.target.value = ""
  }

  const handleSubmit = async e => {
    e.preventDefault()
    if (!user) return

    setError(null)
    setSuccess(null)

    if (!formContent.trim()) {
      setError(new Error("Vui lòng nhập nội dung template"))
      return
    }

    try {
      if (editingTemplate) {
        await updateTemplate(editingTemplate.id, {
          type: formType,
          content: formContent,
          name: formName || undefined
        })
        setSuccess("Đã cập nhật template thành công")
      } else {
        await createTemplate(user.id, {
          type: formType,
          content: formContent,
          name: formName || undefined
        })
        setSuccess("Đã tạo template thành công")
      }
      
      setShowForm(false)
      await loadTemplates()
    } catch (err) {
      setError(err instanceof Error ? err : new Error(err.message || "Lỗi khi lưu template"))
    }
  }

  const getPlaceholdersPreview = content => {
    const placeholders = extractPlaceholders(content)
    if (placeholders.length === 0) return null
    return placeholders.map(p => `{${p}}`).join(", ")
  }

  const getTemplateByType = type => {
    return templates.find(t => t.type === type)
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-8">
          <Loading3QuartersOutlined spin className="text-2xl text-violet-600" />
          <span className="ml-2">Đang tải...</span>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Quản lý Message Templates</h2>
          <div className="flex gap-2">
            <button
              onClick={handleExport}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center gap-2"
            >
              <DownloadOutlined />
              Export
            </button>
            <label className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2 cursor-pointer">
              <UploadOutlined />
              Import
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
              />
            </label>
            <button
              onClick={handleCreate}
              className="bg-violet-600 text-white px-4 py-2 rounded-md hover:bg-violet-700 flex items-center gap-2"
            >
              <PlusOutlined />
              Tạo Template Mới
            </button>
          </div>
        </div>

        <ErrorLabel error={error} className="mb-4" />
        <SuccessLabel success={success} className="mb-4" />

        {showForm && (
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <h3 className="text-xl font-semibold mb-4">
              {editingTemplate ? "Chỉnh sửa Template" : "Tạo Template Mới"}
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Loại Template *
                </label>
                <select
                  value={formType}
                  onChange={e => setFormType(e.target.value)}
                  disabled={!!editingTemplate}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:opacity-50"
                >
                  {Object.values(TEMPLATE_TYPES).map(type => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
                {editingTemplate && (
                  <p className="mt-1 text-xs text-gray-500">
                    Không thể thay đổi loại template khi chỉnh sửa
                  </p>
                )}
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tên Template (tùy chọn)
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  placeholder="Ví dụ: Template giao hàng"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nội dung Template *
                </label>
                <textarea
                  value={formContent}
                  onChange={e => setFormContent(e.target.value)}
                  placeholder='Ví dụ: Hi {cusname}, we are {shopname} on Tiktok. You have order {orderid} for {productname}, shipment date is {date}.'
                  rows="5"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Sử dụng {"{"}placeholder{"}"} để tạo biến, ví dụ: {"{"}cusname{"}"}, {"{"}shopname{"}"}, {"{"}orderid{"}"}, {"{"}productname{"}"}, {"{"}date{"}"}
                </p>
                {formContent && getPlaceholdersPreview(formContent) && (
                  <p className="mt-2 text-sm text-violet-600">
                    Placeholders tìm thấy: <strong>{getPlaceholdersPreview(formContent)}</strong>
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="bg-violet-600 text-white px-4 py-2 rounded-md hover:bg-violet-700"
                >
                  {editingTemplate ? "Cập nhật" : "Tạo"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false)
                    setError(null)
                    setSuccess(null)
                  }}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Templates hiện có</h3>
          
          {templates.length === 0 ? (
            <div className="bg-gray-50 p-6 rounded-lg text-center text-gray-500">
              Chưa có template nào. Nhấn "Tạo Template Mới" để bắt đầu.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.values(TEMPLATE_TYPES).map(type => {
                const template = getTemplateByType(type)
                return (
                  <div
                    key={type}
                    className={`bg-white p-4 rounded-lg shadow-md border-2 ${
                      template ? "border-violet-200" : "border-gray-200 border-dashed"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-lg">{type}</h4>
                      {template && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(template)}
                            className="text-violet-600 hover:text-violet-800"
                            title="Chỉnh sửa"
                          >
                            <EditOutlined />
                          </button>
                          <button
                            onClick={() => handleDelete(template.id)}
                            className="text-red-600 hover:text-red-800"
                            title="Xóa"
                          >
                            <DeleteOutlined />
                          </button>
                        </div>
                      )}
                    </div>
                    
                    {template ? (
                      <div>
                        {template.name && (
                          <p className="text-sm text-gray-600 mb-2">
                            <strong>Tên:</strong> {template.name}
                          </p>
                        )}
                        <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">
                          {template.content}
                        </p>
                        {getPlaceholdersPreview(template.content) && (
                          <p className="mt-2 text-xs text-violet-600">
                            Placeholders: {getPlaceholdersPreview(template.content)}
                          </p>
                        )}
                        <p className="mt-2 text-xs text-gray-400">
                          Cập nhật: {new Date(template.updatedAt).toLocaleString("vi-VN")}
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400 italic">
                        Chưa có template cho loại này
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}


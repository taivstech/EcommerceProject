import api from "@/api/api"

export interface MediaUploadResult {
  url: string
  fileId: string
  name?: string
  thumbnailUrl?: string
}


export const mediaService = {

  upload: async (file: File, folder = "/ecommerce"): Promise<MediaUploadResult> => {
    const formData = new FormData()
    formData.append("file", file)
    formData.append("folder", folder)
    const res = await api.post<MediaUploadResult>("/media/upload", formData)
    if (!res.result) throw new Error("Failed to upload file")
    return res.result
  },


  uploadMultiple: async (files: File[], folder = "/ecommerce"): Promise<MediaUploadResult[]> => {
    const formData = new FormData()
    files.forEach((file) => formData.append("files", file))
    formData.append("folder", folder)
    const res = await api.post<MediaUploadResult[]>("/media/upload-multiple", formData)
    return res.result || []
  },

  delete: async (fileId: string): Promise<void> => {
    await api.del<void>(`/media/${encodeURIComponent(fileId)}`)
  },
}

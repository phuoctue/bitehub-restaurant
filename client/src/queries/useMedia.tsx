import { mediaApiRequest } from "@/apiRequest/media"
import { useMutation } from "@tanstack/react-query"

export const useUploadImageMutation = () => {
    return useMutation({
        mutationFn: mediaApiRequest.upload
    })
}
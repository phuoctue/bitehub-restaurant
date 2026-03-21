import accountApiRequest from "@/apiRequest/account"
import { useMutation, useQuery } from "@tanstack/react-query"
import { on } from "events"
import { use } from "react"

export const useAccountMe = () => {
return useQuery({
    queryKey: ['account-me'],
    queryFn: accountApiRequest.me
})
}


export const useUpdateMeMutation = () => {
    return useMutation({
        mutationFn: accountApiRequest.updatMe
    })
}

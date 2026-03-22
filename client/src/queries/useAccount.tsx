import accountApiRequest from "@/apiRequest/account";
import { useMutation, useQuery } from "@tanstack/react-query";

export const useAccountMe = () => {
  return useQuery({
    queryKey: ["account-me"],
    queryFn: accountApiRequest.me,
  });
};

export const useUpdateMeMutation = () => {
  return useMutation({
    mutationFn: accountApiRequest.updatMe,
  });
};

export const useChangePasswordMutation = () => {
  return useMutation({
    mutationFn: accountApiRequest.changPassword,
  });
};

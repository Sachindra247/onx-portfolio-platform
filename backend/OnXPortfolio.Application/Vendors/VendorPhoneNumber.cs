
using System.Text.RegularExpressions;

namespace OnXPortfolio.Application.Vendors;

public static class VendorPhoneNumber
{
    public static bool TryNormalize(
        string? phone,
        out string? normalizedPhone)
    {
        normalizedPhone = null;

        if (string.IsNullOrWhiteSpace(phone))
        {
            return true;
        }

        var input = phone.Trim();

        if (!Regex.IsMatch(
            input,
            @"^\+?[0-9\s().-]+$"))
        {
            return false;
        }

        var digits = Regex.Replace(
            input,
            @"[^0-9]",
            string.Empty);

        if (input.StartsWith("+") &&
            (digits.Length != 11 || digits[0] != '1'))
        {
            return false;
        }

        if (digits.Length == 11 && digits[0] == '1')
        {
            digits = digits.Substring(1);
        }

        if (digits.Length != 10)
        {
            return false;
        }

        if (digits[0] < '2' || digits[3] < '2')
        {
            return false;
        }

        normalizedPhone =
            $"+1 ({digits.Substring(0, 3)}) " +
            $"{digits.Substring(3, 3)}-" +
            $"{digits.Substring(6, 4)}";

        return true;
    }
}

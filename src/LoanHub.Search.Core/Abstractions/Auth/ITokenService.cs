using System.Security.Claims;
using LoanHub.Search.Core.Models.Users;

namespace LoanHub.Search.Core.Abstractions.Auth;

public interface ITokenService
{
    string CreateToken(UserAccount user);
    ClaimsPrincipal? ValidateToken(string token);
}

namespace OnXPortfolio.Application.Certifications;

public sealed class CertificationPersonLookupDto
{
    public Guid? CertificationPersonId {
        get;
        init;
    }

    public Guid? ApplicationUserId {
        get;
        init;
    }

    public string Name { get; init; } =
        string.Empty;

    public string? Email { get; init; }

    public Guid? ManagerCertificationPersonId {
        get;
        init;
    }

    public Guid? ManagerApplicationUserId {
        get;
        init;
    }

    public string? ManagerName {
        get;
        init;
    }

    public string? ManagerEmail {
        get;
        init;
    }

    public bool IsApplicationUser {
        get;
        init;
    }
}
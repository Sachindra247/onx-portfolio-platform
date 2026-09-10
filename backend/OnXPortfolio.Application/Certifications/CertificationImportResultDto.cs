namespace OnXPortfolio.Application.Certifications;

public sealed class CertificationImportResultDto
{
    public int TotalRows { get; set; }

    public int Created { get; set; }

    public int Updated { get; set; }

    public int Archived { get; set; }

    public int TotalChanged =>
        Created + Updated + Archived;

    public List<Guid> CreatedCertificationIds { get; set; } = [];
}